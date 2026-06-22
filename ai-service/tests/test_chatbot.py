"""
tests/test_chatbot.py
=====================
Comprehensive test suite for the Boxify AI Service (FastAPI / Gemini).

Test categories
---------------
1.  Unit – search_faq()         : dataset scoring logic, edge cases
2.  Unit – execute_tool()       : tool dispatch, auth guards, error handling
3.  Unit – session helpers      : get/save with db=None fallback
4.  Integration – /chat POST    : full request/response cycle (Gemini mocked)
5.  Integration – /chat POST    : multi-language (ar / en)
6.  Integration – /chat POST    : tool-calling scenarios (search_faq, recommend_box, …)
7.  Integration – /chat POST    : ReAct loop / max-iteration guard
8.  Integration – /chat POST    : unauthenticated vs authenticated tool calls
9.  Integration – DELETE /session/{id}  : session clearing
10. Integration – GET /         : health-check endpoint

Run with:
    pip install pytest pytest-asyncio httpx
    pytest ai-service/tests/test_chatbot.py -v
"""

import json
import sys
import os
import types as pytypes
from unittest.mock import AsyncMock, MagicMock, patch, call
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# ── Make sure the ai-service package root is on sys.path ──────────────────────
AI_SERVICE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if AI_SERVICE_DIR not in sys.path:
    sys.path.insert(0, AI_SERVICE_DIR)


# ── Fixtures / helpers ────────────────────────────────────────────────────────

def make_gemini_text_response(text: str):
    """Build a minimal fake Gemini response object with a plain-text reply."""
    part = MagicMock()
    part.text = text
    part.function_call = None

    content = MagicMock()
    content.parts = [part]

    candidate = MagicMock()
    candidate.content = content

    response = MagicMock()
    response.candidates = [candidate]
    return response


def make_gemini_tool_then_text(tool_name: str, tool_args: dict, final_text: str):
    """
    Return a pair of fake Gemini responses:
      1st call  → function-call response (triggers tool execution)
      2nd call  → plain text (final answer)
    """
    # ── First response: function call ──────────────────────────────────────────
    fc = MagicMock()
    fc.name = tool_name
    fc.args = tool_args

    fc_part = MagicMock()
    fc_part.text = None
    fc_part.function_call = fc

    fc_content = MagicMock()
    fc_content.parts = [fc_part]

    fc_candidate = MagicMock()
    fc_candidate.content = fc_content

    fc_response = MagicMock()
    fc_response.candidates = [fc_candidate]

    # ── Second response: plain text ────────────────────────────────────────────
    text_response = make_gemini_text_response(final_text)

    return [fc_response, text_response]


# ═══════════════════════════════════════════════════════════════════════════════
# 1. Unit tests — search_faq()
# ═══════════════════════════════════════════════════════════════════════════════

class TestSearchFaq:
    """Tests for the local FAQ search scoring logic."""

    def setup_method(self):
        """Patch the dataset used inside main.py before each test."""
        self._dataset_patcher = patch("main.dataset", [
            {
                "question_en": "what is the delivery policy",
                "question_ar": "ما هي سياسة التوصيل",
                "answer": "We deliver within 2 business days.",
                "answer_ar": "نوصل خلال يومين عمل.",
            },
            {
                "question_en": "how do i cancel my subscription",
                "question_ar": "كيف ألغي اشتراكي",
                "answer": "You can cancel anytime from your account settings.",
                "answer_ar": "يمكنك الإلغاء في أي وقت من إعدادات حسابك.",
            },
            {
                "question_en": "payment methods accepted",
                "question_ar": "طرق الدفع المتاحة",
                "answer": "We accept Visa, Mastercard, and cash on delivery.",
                "answer_ar": "نقبل فيزا وماستركارد والدفع عند الاستلام.",
            },
        ])
        self._dataset_patcher.start()
        import main
        self.search_faq = main.search_faq

    def teardown_method(self):
        self._dataset_patcher.stop()

    # ── Happy-path matching ────────────────────────────────────────────────────

    def test_exact_en_match(self):
        result = self.search_faq("delivery policy", language="en")
        assert result is not None
        assert "2 business days" in result

    def test_exact_ar_match(self):
        result = self.search_faq("سياسة التوصيل", language="ar")
        assert result is not None
        assert "يومين" in result

    def test_keyword_match_en(self):
        result = self.search_faq("cancel subscription", language="en")
        assert result is not None
        assert "cancel" in result.lower()

    def test_keyword_match_ar(self):
        result = self.search_faq("طرق الدفع", language="ar")
        assert result is not None
        assert "فيزا" in result

    def test_returns_arabic_answer_by_default(self):
        """Default language is 'ar', so Arabic answer should be returned."""
        result = self.search_faq("delivery policy")
        assert result is not None
        # Arabic answer contains Arabic chars
        assert any("\u0600" <= c <= "\u06FF" for c in result)

    def test_returns_english_answer_when_lang_en(self):
        result = self.search_faq("payment methods", language="en")
        assert result is not None
        assert "Visa" in result

    # ── Edge cases ─────────────────────────────────────────────────────────────

    def test_too_short_query_returns_none(self):
        """Queries shorter than 4 chars should always return None."""
        assert self.search_faq("hi") is None
        assert self.search_faq("ok") is None
        assert self.search_faq("pay") is None  # exactly 3 chars

    def test_unrelated_query_returns_none(self):
        result = self.search_faq("football team ranking")
        assert result is None

    def test_empty_dataset_returns_none(self):
        with patch("main.dataset", []):
            result = self.search_faq("delivery policy")
        assert result is None

    def test_low_score_below_threshold_returns_none(self):
        """Single common word that appears in many items but score < 2."""
        # 'i' is only 1 char so it gets skipped; 'the' might score 1 — under threshold
        result = self.search_faq("the blah blah")
        assert result is None

    def test_partial_word_overlap(self):
        """Query containing words that appear in both Arabic + English fields scores >= 2."""
        # 'cancel' hits en question; 'subscription' substring is inside en question too
        result = self.search_faq("cancel my subscription", language="en")
        assert result is not None
        assert "cancel" in result.lower()

    # ── Fuzzy Matching & Typo Resilience Tests ─────────────────────────────────

    def test_arabic_letter_normalization(self):
        """Arabic letter variations like Alefs, Teh Marbutas, and Yehs are unified."""
        # 'إلغاء' with Hamza, 'إشتراكي' with Hamza and 'ي' at end instead of 'ى'
        result = self.search_faq("كيف إلغاء إشتراكي", language="ar")
        assert result is not None
        assert "الإلغاء" in result or "إعدادات حسابك" in result or "يمكنك" in result

    def test_arabic_prefix_stripping(self):
        """Arabic prefixes like 'الـ' and 'بالـ' are stripped and matched correctly."""
        # 'بالتوصيل' instead of 'التوصيل'
        result = self.search_faq("ما هي سياسة بالتوصيل", language="ar")
        assert result is not None
        assert "يومين" in result

    def test_typo_resilience_arabic(self):
        """Arabic spelling typos are handled gracefully by fuzzy sequence matching."""
        # 'التوسيل' instead of 'التوصيل'
        result = self.search_faq("سياسة التوسيل", language="ar")
        assert result is not None
        assert "يومين" in result

    def test_typo_resilience_english(self):
        """English typos (substitutions/omissions) are resolved gracefully."""
        # 'subscribtion' instead of 'subscription'
        result = self.search_faq("how cancel subscribtion", language="en")
        assert result is not None
        assert "cancel" in result.lower()

    def test_english_stemming(self):
        """English plural and participle suffixes are stemmed (ies, ing, ed, s)."""
        # 'deliveries' (ies -> y) should match 'delivery'
        result = self.search_faq("what is the deliveries policy", language="en")
        assert result is not None
        assert "2 business days" in result

    def test_out_of_order_query(self):
        """Query with out-of-order words matches the target correctly."""
        # 'دفع طرق' instead of 'طرق الدفع'
        result = self.search_faq("دفع طرق", language="ar")
        assert result is not None
        assert "فيزا" in result



# ═══════════════════════════════════════════════════════════════════════════════
# 2. Unit tests — execute_tool()
# ═══════════════════════════════════════════════════════════════════════════════

class TestExecuteTool:
    """Tests for the tool dispatcher (execute_tool)."""

    @pytest.fixture(autouse=True)
    def _patch_db(self):
        """Keep db=None for most unit tests to avoid real network calls."""
        with patch("main.db", None):
            yield

    @pytest.mark.asyncio
    async def test_search_faq_tool_found(self):
        import main
        with patch("main.search_faq", return_value="We deliver within 2 days."):
            result = await main.execute_tool("search_faq", {"query": "delivery"})
        assert result["found"] is True
        assert "We deliver" in result["answer"]

    @pytest.mark.asyncio
    async def test_search_faq_tool_not_found(self):
        import main
        with patch("main.search_faq", return_value=None):
            result = await main.execute_tool("search_faq", {"query": "basketball"})
        assert result["found"] is False
        assert "No FAQ" in result["message"]

    @pytest.mark.asyncio
    async def test_add_to_cart_requires_token(self):
        import main
        result = await main.execute_tool(
            "add_to_cart",
            {"boxId": "abc123", "servingSize": 2},
            user_token=None,
        )
        assert "error" in result
        assert "logged in" in result["error"]

    @pytest.mark.asyncio
    async def test_create_custom_box_requires_token(self):
        import main
        result = await main.execute_tool(
            "create_custom_box",
            {"mealIds": ["meal1", "meal2"]},
            user_token=None,
        )
        assert "error" in result
        assert "logged in" in result["error"]

    @pytest.mark.asyncio
    async def test_create_subscription_requires_token(self):
        import main
        result = await main.execute_tool(
            "create_subscription",
            {"boxId": "box1", "servingSize": 2, "frequency": "weekly"},
            user_token=None,
        )
        assert "error" in result
        assert "logged in" in result["error"]

    @pytest.mark.asyncio
    async def test_get_available_meals_db_unavailable(self):
        """When db is None, should return empty list with error key."""
        import main
        result = await main.execute_tool("get_available_meals", {})
        assert result["meals"] == []
        assert "error" in result

    @pytest.mark.asyncio
    async def test_get_available_meals_from_db(self):
        """With a mock db, meals should be returned correctly."""
        import main
        fake_meal = {
            "_id": MagicMock(__str__=lambda self: "meal_id_1"),
            "name": "Grilled Salmon",
            "description": "Fresh salmon",
            "dietType": "keto",
            "pricePerServing": 85.0,
            "caloriesPerServing": 420,
            "allergens": ["fish"],
        }
        mock_cursor = MagicMock()
        mock_cursor.to_list = AsyncMock(return_value=[fake_meal])
        mock_db = MagicMock()
        mock_db.meals.find.return_value = mock_cursor
        with patch("main.db", mock_db):
            result = await main.execute_tool(
                "get_available_meals", {"dietType": "keto"}
            )
        assert result["count"] == 1
        assert result["meals"][0]["name"] == "Grilled Salmon"
        assert result["meals"][0]["dietType"] == "keto"

    @pytest.mark.asyncio
    async def test_unknown_tool_returns_error(self):
        import main
        result = await main.execute_tool("nonexistent_tool", {})
        assert "error" in result
        assert "Unknown tool" in result["error"]

    @pytest.mark.asyncio
    async def test_recommend_box_calls_backend(self):
        """recommend_box should call the /api/boxes/recommended endpoint."""
        import main
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "boxes": [
                {
                    "_id": "box1",
                    "name": "Keto Bliss",
                    "description": "A keto box",
                    "dietType": "keto",
                    "priceForServing": 120.0,
                    "basePrice": 100.0,
                    "image": "https://example.com/img.jpg",
                    "meals": [{"name": "Salmon Bowl"}],
                }
            ]
        }
        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_cm = MagicMock()
        mock_cm.__aenter__ = AsyncMock(return_value=mock_client)
        mock_cm.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_cm):
            result = await main.execute_tool(
                "recommend_box",
                {"dietType": "keto", "maxPrice": 150},
                user_token="fake_token",
            )
        assert result["count"] == 1
        assert result["boxes"][0]["name"] == "Keto Bliss"
        assert result["boxes"][0]["dietType"] == "keto"

    @pytest.mark.asyncio
    async def test_add_to_cart_success(self):
        import main
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "message": "Added to cart",
            "cart": {"cartTotal": 240.0},
        }
        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response
        mock_cm = MagicMock()
        mock_cm.__aenter__ = AsyncMock(return_value=mock_client)
        mock_cm.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_cm):
            result = await main.execute_tool(
                "add_to_cart",
                {"boxId": "box1", "servingSize": 2, "quantity": 1},
                user_token="tok",
            )
        assert result["success"] is True
        assert result["cartTotal"] == 240.0

    @pytest.mark.asyncio
    async def test_add_to_cart_backend_error(self):
        import main
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_response.json.return_value = {"message": "Box not found"}
        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response
        mock_cm = MagicMock()
        mock_cm.__aenter__ = AsyncMock(return_value=mock_client)
        mock_cm.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_cm):
            result = await main.execute_tool(
                "add_to_cart",
                {"boxId": "bad_id", "servingSize": 2},
                user_token="tok",
            )
        assert "error" in result
        assert "Box not found" in result["error"]

    @pytest.mark.asyncio
    async def test_tool_timeout_returns_error(self):
        """Network timeout should be caught and returned as an error dict."""
        import main
        import httpx
        mock_client = AsyncMock()
        mock_client.get.side_effect = httpx.TimeoutException("timed out")
        mock_cm = MagicMock()
        mock_cm.__aenter__ = AsyncMock(return_value=mock_client)
        mock_cm.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_cm):
            result = await main.execute_tool(
                "recommend_box", {}, user_token="tok"
            )
        assert "error" in result
        assert "timed out" in result["error"].lower()


# ═══════════════════════════════════════════════════════════════════════════════
# 3. Unit tests — session helpers
# ═══════════════════════════════════════════════════════════════════════════════

class TestSessionHelpers:

    @pytest.mark.asyncio
    async def test_get_session_history_db_none(self):
        import main
        with patch("main.db", None):
            history = await main.get_session_history("session-xyz")
        assert history == []

    @pytest.mark.asyncio
    async def test_get_session_history_not_found(self):
        import main
        mock_db = MagicMock()
        mock_db.chat_sessions.find_one = AsyncMock(return_value=None)
        with patch("main.db", mock_db):
            history = await main.get_session_history("session-xyz")
        assert history == []

    @pytest.mark.asyncio
    async def test_get_session_history_returns_messages(self):
        import main
        mock_db = MagicMock()
        mock_db.chat_sessions.find_one = AsyncMock(return_value={
            "sessionId": "s1",
            "messages": [
                {"role": "user", "content": "Hello"},
                {"role": "model", "content": "Hi there!"},
            ],
        })
        with patch("main.db", mock_db):
            history = await main.get_session_history("s1")
        assert len(history) == 2
        assert history[0]["role"] == "user"

    @pytest.mark.asyncio
    async def test_save_session_message_db_none(self):
        """Should silently succeed (no error) when db is None."""
        import main
        with patch("main.db", None):
            await main.save_session_message("s1", "user", "hello")  # must not raise

    @pytest.mark.asyncio
    async def test_save_session_message_calls_update_one(self):
        import main
        mock_db = MagicMock()
        mock_db.chat_sessions.update_one = AsyncMock()
        with patch("main.db", mock_db):
            await main.save_session_message("s1", "user", "hello")
        mock_db.chat_sessions.update_one.assert_called_once()
        args, kwargs = mock_db.chat_sessions.update_one.call_args
        assert kwargs.get("upsert") is True


# ═══════════════════════════════════════════════════════════════════════════════
# 4–9. Integration tests — FastAPI HTTP endpoints
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.fixture
def mock_db():
    """A mock MongoDB db object wired to session helpers (async-compatible)."""
    db = MagicMock()
    db.chat_sessions.find_one = AsyncMock(return_value=None)  # no prior history
    db.chat_sessions.update_one = AsyncMock(return_value=None)
    db.chat_sessions.delete_one = AsyncMock(return_value=None)
    return db


@pytest.fixture
def app_with_mocks(mock_db):
    """Import the FastAPI app with Gemini retry helper + MongoDB patched out."""
    with (
        patch("main.db", mock_db),
        patch("main.gemini_generate_with_retry") as mock_gemini_retry,
    ):
        import main
        yield main.app, mock_gemini_retry


@pytest.mark.asyncio
class TestHealthEndpoint:
    async def test_root_returns_ok(self, app_with_mocks):
        app, _ = app_with_mocks
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert "Boxify" in data["message"]
        assert "model" in data


@pytest.mark.asyncio
class TestChatEndpoint:
    """Integration tests for POST /chat."""

    # ── Happy-path plain text ──────────────────────────────────────────────────

    async def test_basic_text_response_english(self, app_with_mocks):
        app, mock_gemini_retry = app_with_mocks
        mock_gemini_retry.return_value = make_gemini_text_response(
            "Hello! How can I help you with Boxify today?"
        )
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/chat", json={
                "message": "Hello",
                "sessionId": "test-session-en",
                "language": "en",
            })
        assert resp.status_code == 200
        body = resp.json()
        assert "answer" in body
        assert "Hello" in body["answer"]
        assert body["source"] == "gemini"

    async def test_basic_text_response_arabic(self, app_with_mocks):
        app, mock_gemini_retry = app_with_mocks
        mock_gemini_retry.return_value = make_gemini_text_response(
            "أهلاً! كيف ممكن أساعدك؟"
        )
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/chat", json={
                "message": "مرحبا",
                "sessionId": "test-session-ar",
                "language": "ar",
            })
        assert resp.status_code == 200
        body = resp.json()
        assert body["source"] == "gemini"
        # Arabic response should contain Arabic characters
        assert any("\u0600" <= c <= "\u06FF" for c in body["answer"])

    async def test_message_is_required(self, app_with_mocks):
        """Pydantic validation: missing 'message' field should return 422."""
        app, _ = app_with_mocks
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/chat", json={"sessionId": "s1"})
        assert resp.status_code == 422

    async def test_defaults_language_to_ar(self, app_with_mocks):
        """When message contains Arabic script, detect_language returns 'ar' automatically."""
        app, mock_gemini_retry = app_with_mocks
        mock_gemini_retry.return_value = make_gemini_text_response(
            "أهلاً بيك!"
        )
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/chat", json={
                "message": "مرحبا",
                "sessionId": "s-defaults",
            })
        assert resp.status_code == 200
        # Verify the retry helper was called with the right config
        call_args = mock_gemini_retry.call_args
        config = call_args[0][1]  # second positional arg is config
        assert "LANGUAGE RULE" in config.system_instruction

    async def test_fallback_when_answer_is_empty(self, app_with_mocks):
        """When Gemini returns empty text, a fallback message should be returned."""
        app, mock_gemini_retry = app_with_mocks
        mock_gemini_retry.return_value = make_gemini_text_response("")
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/chat", json={
                "message": "hmm",
                "language": "en",
                "sessionId": "s-fallback",
            })
        assert resp.status_code == 200
        body = resp.json()
        # Should return non-empty fallback text
        assert len(body["answer"]) > 0

    # ── Tool-calling scenarios ─────────────────────────────────────────────────

    async def test_faq_tool_call_flow(self, app_with_mocks):
        """Gemini triggers search_faq → execute_tool → Gemini replies with text."""
        app, mock_gemini_retry = app_with_mocks
        responses = make_gemini_tool_then_text(
            tool_name="search_faq",
            tool_args={"query": "delivery policy"},
            final_text="We deliver within 2 business days.",
        )
        mock_gemini_retry.side_effect = responses

        with patch("main.search_faq", return_value="We deliver within 2 business days."):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                resp = await client.post("/chat", json={
                    "message": "What is the delivery policy?",
                    "language": "en",
                    "sessionId": "s-faq",
                })

        assert resp.status_code == 200
        body = resp.json()
        assert body["source"] == "gemini"
        # toolCalls should record the FAQ call
        assert len(body["toolCalls"]) == 1
        assert body["toolCalls"][0]["tool"] == "search_faq"

    async def test_recommend_box_tool_call_flow(self, app_with_mocks):
        """Gemini triggers recommend_box and returns box recommendations."""
        app, mock_gemini_retry = app_with_mocks
        responses = make_gemini_tool_then_text(
            tool_name="recommend_box",
            tool_args={"dietType": "keto"},
            final_text="Here are some keto boxes for you!",
        )
        mock_gemini_retry.side_effect = responses

        fake_box_result = {
            "boxes": [{"id": "b1", "name": "Keto Bliss", "dietType": "keto", "price": 120}],
            "count": 1,
        }
        with patch("main.execute_tool", new=AsyncMock(return_value=fake_box_result)):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                resp = await client.post("/chat", json={
                    "message": "Recommend a keto box",
                    "language": "en",
                    "sessionId": "s-recommend",
                })

        assert resp.status_code == 200
        body = resp.json()
        assert "keto" in body["answer"].lower()

    async def test_add_to_cart_requires_auth_token(self, app_with_mocks):
        """When no userToken provided, add_to_cart tool should return auth error."""
        app, mock_gemini_retry = app_with_mocks
        responses = make_gemini_tool_then_text(
            tool_name="add_to_cart",
            tool_args={"boxId": "box1", "servingSize": 2},
            final_text="Please sign in to add items to your cart.",
        )
        mock_gemini_retry.side_effect = responses

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/chat", json={
                "message": "Add to cart",
                "language": "en",
                "sessionId": "s-cart-noauth",
                # no userToken
            })

        assert resp.status_code == 200
        body = resp.json()
        tc = body["toolCalls"]
        assert len(tc) == 1
        assert "error" in tc[0]["result"]
        assert "logged in" in tc[0]["result"]["error"]

    async def test_subscription_flow_with_token(self, app_with_mocks):
        """With a valid token, create_subscription tool should succeed."""
        app, mock_gemini_retry = app_with_mocks
        responses = make_gemini_tool_then_text(
            tool_name="create_subscription",
            tool_args={"boxId": "box1", "servingSize": 2, "frequency": "weekly"},
            final_text="Subscription created successfully!",
        )
        mock_gemini_retry.side_effect = responses

        sub_result = {
            "success": True,
            "message": "Subscription created",
            "subscriptionId": "sub_abc",
        }
        with patch("main.execute_tool", new=AsyncMock(return_value=sub_result)):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                resp = await client.post("/chat", json={
                    "message": "Subscribe me weekly",
                    "language": "en",
                    "sessionId": "s-sub",
                    "userToken": "valid_token_abc",
                })

        assert resp.status_code == 200
        assert resp.json()["source"] == "gemini"

    # ── ReAct loop / guard ─────────────────────────────────────────────────────

    async def test_max_iterations_guard(self, app_with_mocks):
        """If Gemini keeps calling tools for 5 iterations, return a fallback message."""
        app, mock_gemini_retry = app_with_mocks

        # Always return a tool-call response (never a plain-text response)
        always_tool = make_gemini_tool_then_text(
            tool_name="search_faq",
            tool_args={"query": "loop"},
            final_text="never reached",
        )
        # Return only the first (tool-call) response indefinitely
        mock_gemini_retry.side_effect = [always_tool[0]] * 10

        with patch("main.search_faq", return_value="FAQ answer"):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                resp = await client.post("/chat", json={
                    "message": "Tell me everything",
                    "language": "en",
                    "sessionId": "s-maxiter",
                })

        assert resp.status_code == 200
        body = resp.json()
        assert body["source"] == "error"
        assert "try again" in body["answer"].lower()

    # ── Session persistence ────────────────────────────────────────────────────

    async def test_session_messages_saved(self, app_with_mocks, mock_db):
        """After a chat, save_session_message should have been called for user + model."""
        app, mock_gemini_retry = app_with_mocks
        mock_gemini_retry.return_value = make_gemini_text_response(
            "Sure, here's info about delivery!"
        )
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/chat", json={
                "message": "Delivery info",
                "language": "en",
                "sessionId": "s-persist",
            })
        # update_one should have been called at least twice (user msg + model msg)
        assert mock_db.chat_sessions.update_one.call_count >= 2

    async def test_session_history_sent_to_gemini(self, app_with_mocks, mock_db):
        """Prior session history should be included in the Gemini call."""
        app, mock_gemini_retry = app_with_mocks
        mock_db.chat_sessions.find_one.return_value = {
            "sessionId": "s-history",
            "messages": [
                {"role": "user", "content": "What's your name?"},
                {"role": "model", "content": "I am Boxify Chef!"},
            ],
        }
        mock_gemini_retry.return_value = make_gemini_text_response(
            "As I mentioned, I am Boxify Chef!"
        )
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/chat", json={
                "message": "What's your name again?",
                "language": "en",
                "sessionId": "s-history",
            })
        assert resp.status_code == 200
        # The contents list sent to Gemini should include the history messages
        call_args = mock_gemini_retry.call_args
        contents = call_args[0][0]  # first positional arg is contents
        # At least: 2 history + 1 new user message
        assert len(contents) >= 3

    # ── Error handling ─────────────────────────────────────────────────────────

    async def test_gemini_exception_returns_500_like_response(self, app_with_mocks):
        """If Gemini raises an exception, endpoint should return a graceful error message."""
        app, mock_gemini_retry = app_with_mocks
        mock_gemini_retry.side_effect = RuntimeError("Gemini is down")
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/chat", json={
                "message": "Hello",
                "language": "en",
                "sessionId": "s-err",
            })
        assert resp.status_code == 200  # endpoint catches and returns 200 with error body
        body = resp.json()
        assert body["source"] in ("error", "faq_fallback")
        assert len(body["answer"]) > 0

    async def test_empty_string_message(self, app_with_mocks):
        """An empty-string message is technically valid Pydantic; Gemini decides response."""
        app, mock_gemini_retry = app_with_mocks
        mock_gemini_retry.return_value = make_gemini_text_response(
            "Could you rephrase?"
        )
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/chat", json={
                "message": "",
                "language": "en",
                "sessionId": "s-empty",
            })
        assert resp.status_code == 200

    async def test_very_long_message(self, app_with_mocks):
        """Long messages should not break the endpoint."""
        app, mock_gemini_retry = app_with_mocks
        mock_gemini_retry.return_value = make_gemini_text_response(
            "Thanks for the detailed question!"
        )
        long_msg = "Tell me about Boxify. " * 200
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/chat", json={
                "message": long_msg,
                "language": "en",
                "sessionId": "s-long",
            })
        assert resp.status_code == 200

    # ── Language selection ────────────────────────────────────────────────────

    async def test_english_system_prompt_selected(self, app_with_mocks):
        """Single unified prompt is always used regardless of message language."""
        app, mock_gemini_retry = app_with_mocks
        mock_gemini_retry.return_value = make_gemini_text_response("Hi!")
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/chat", json={
                "message": "Hi",
                "sessionId": "s-en-prompt",
            })
        call_args = mock_gemini_retry.call_args
        config = call_args[0][1]  # second positional arg is config
        # Unified prompt contains the LANGUAGE RULE block
        assert "LANGUAGE RULE" in config.system_instruction
        assert "Boxify Chef" in config.system_instruction

    async def test_arabic_system_prompt_selected(self, app_with_mocks):
        """Same unified prompt is used for Arabic messages too."""
        app, mock_gemini_retry = app_with_mocks
        mock_gemini_retry.return_value = make_gemini_text_response("أهلاً!")
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/chat", json={
                "message": "مرحبا",
                "sessionId": "s-ar-prompt",
            })
        call_args = mock_gemini_retry.call_args
        config = call_args[0][1]  # second positional arg is config
        assert "LANGUAGE RULE" in config.system_instruction
        assert "Boxify Chef" in config.system_instruction


# ═══════════════════════════════════════════════════════════════════════════════
# 9. Integration tests — DELETE /session/{session_id}
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
class TestSessionEndpoint:

    async def test_clear_session_with_db(self, app_with_mocks, mock_db):
        app, _ = app_with_mocks
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.delete("/session/my-session-id")
        assert resp.status_code == 200
        assert "cleared" in resp.json()["message"].lower()
        mock_db.chat_sessions.delete_one.assert_called_once_with(
            {"sessionId": "my-session-id"}
        )

    async def test_clear_session_without_db(self, app_with_mocks):
        app, _ = app_with_mocks
        with patch("main.db", None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                resp = await client.delete("/session/orphan-session")
        assert resp.status_code == 200
        assert "cleared" in resp.json()["message"].lower()
