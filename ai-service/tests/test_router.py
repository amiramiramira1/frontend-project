"""
tests/test_router.py
====================
Unit and integration tests for the Similarity Upgrade features:
  1. Cosine similarity Box Ranking functions
  2. Intent Router pre-classification
  3. Fast-path FAQ /chat routing
"""

import os
import sys
import json
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from httpx import AsyncClient, ASGITransport

AI_SERVICE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if AI_SERVICE_DIR not in sys.path:
    sys.path.insert(0, AI_SERVICE_DIR)

import main

# ═══════════════════════════════════════════════════════════════════════════════
# 1. Cosine Similarity & Vectorization Tests
# ═══════════════════════════════════════════════════════════════════════════════

def test_box_to_vector():
    # Test Vegan Keto budget box
    box = {
        "dietType": "vegan",
        "price": 180.0,
        "meals": [
            {"name": "Vegan Meal", "allergens": ["dairy"]}
        ]
    }
    vec = main.box_to_vector(box)
    assert len(vec) == 15
    # Diet index 0 is vegan
    assert vec[0] == 1.0
    # Diet index 2 is keto
    assert vec[2] == 0.0
    # Allergen dairy is index 1 of allergens (gluten, dairy, nuts, ...) -> global ALLERGENS has dairy at index 1
    # safe from dairy? No, dairy is in allergens, so vec[6 + 1] should be 0.0
    assert vec[7] == 0.0
    # safe from nuts? Yes, not in meals, so vec[6 + 2] should be 1.0
    assert vec[8] == 1.0
    # budget under 300 EGP? Yes, 180 <= 300 so vec[13] is 1.0
    assert vec[13] == 1.0


def test_preference_to_vector():
    prefs = {
        "dietTypes": ["vegan"],
        "allergens": ["dairy"],
        "maxPrice": 250,
        "wantsLight": True
    }
    vec = main.preference_to_vector(prefs)
    assert len(vec) == 15
    assert vec[0] == 1.0  # vegan
    assert vec[7] == 1.0  # dairy allergy wants to avoid it (so safety dimension is active)
    assert vec[13] == 1.0 # price <= 300 -> 1.0
    assert vec[14] == 1.0 # wantsLight


def test_cosine_similarity():
    import numpy as np
    a = np.array([1, 1, 0, 0])
    b = np.array([1, 1, 0, 0])
    c = np.array([0, 0, 1, 1])
    assert main.cosine_similarity(a, b) == pytest.approx(1.0)
    assert main.cosine_similarity(a, c) == pytest.approx(0.0)


def test_rank_boxes_by_preference():
    boxes = [
        {
            "name": "Standard Mix",
            "dietType": "standard",
            "price": 350.0,
            "meals": []
        },
        {
            "name": "Pure Vegan Delight",
            "dietType": "vegan",
            "price": 200.0,
            "meals": []
        }
    ]
    prefs = {
        "dietTypes": ["vegan"],
        "maxPrice": 250
    }
    ranked = main.rank_boxes_by_preference(boxes, prefs)
    assert len(ranked) == 2
    assert ranked[0]["name"] == "Pure Vegan Delight"


# ═══════════════════════════════════════════════════════════════════════════════
# 2. Intent Classification Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestIntentRouter:
    @pytest.fixture(autouse=True)
    def setup_mock_dataset(self):
        self.mock_data = [
            {
                "question_en": "how do i cancel my subscription",
                "question_ar": "كيف الغي اشتراكي",
                "intent": "faq",
                "answer": "Go to settings.",
                "answer_ar": "اذهب للاعدادات."
            },
            {
                "question_en": "recommend a healthy keto box",
                "question_ar": "رشحلي بوكس كيتو صحي",
                "intent": "recommendation",
                "answer": "Here are recommendations.",
                "answer_ar": "اليك ترشيحات."
            }
        ]
        with patch("main.dataset", self.mock_data):
            main._ensure_indices_built()
            yield

    def test_classify_faq_english(self):
        assert main.classify_intent("cancel my subscription", "en") == "faq"

    def test_classify_faq_arabic(self):
        assert main.classify_intent("الغي اشتراكي", "ar") == "faq"

    def test_classify_recommendation_english(self):
        assert main.classify_intent("recommend keto box", "en") == "recommendation"

    def test_classify_recommendation_arabic(self):
        assert main.classify_intent("رشحلي كيتو", "ar") == "recommendation"

    def test_classify_other_vague(self):
        assert main.classify_intent("hello there", "en") == "other"


# ═══════════════════════════════════════════════════════════════════════════════
# 3. /chat Fast-Path Integration Tests
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_chat_faq_fast_path():
    mock_data = [
        {
            "question_en": "what is the refund policy",
            "question_ar": "سياسة الاسترداد والارجاع",
            "intent": "faq",
            "answer": "Full refund within 14 days.",
            "answer_ar": "استرداد كامل خلال ١٤ يوم."
        },
        {
            "question_en": "recommend a box",
            "question_ar": "رشحلي علبة",
            "intent": "recommendation",
            "answer": "Keto boxes are best.",
            "answer_ar": "علب الكيتو هي الافضل."
        }
    ]
    
    mock_db = MagicMock()
    mock_db.chat_sessions.find_one = AsyncMock(return_value=None)
    mock_db.chat_sessions.update_one = AsyncMock(return_value=None)
    
    main.FORCE_FAST_PATH = True
    
    # We patch environment so PYTEST_CURRENT_TEST is not checked or we bypass check
    with patch("main.dataset", mock_data), \
         patch("main.db", mock_db), \
         patch("main.save_session_message", new=AsyncMock()) as mock_save:
         
        main._ensure_indices_built()
        
        async with AsyncClient(transport=ASGITransport(app=main.app), base_url="http://test") as client:
            resp = await client.post("/chat", json={
                "message": "refund policy",
                "sessionId": "fast-path-test"
            })
            
        assert resp.status_code == 200
        body = resp.json()
        assert body["source"] == "bm25_faq"
        assert "refund" in body["answer"] or "استرداد" in body["answer"]
        assert body["toolCalls"] == []
        
        # Save message should have been called twice (user and model)
        assert mock_save.call_count == 2
        
    main.FORCE_FAST_PATH = False


# ═══════════════════════════════════════════════════════════════════════════════
# 4. State-Aware Router Unit Tests
# ═══════════════════════════════════════════════════════════════════════════════

def test_determine_next_mode_custom_box_english():
    mode, confidence, reason = main.determine_next_mode("build my own box", "en")
    assert mode == "custom_box"
    assert confidence >= 0.9

def test_determine_next_mode_custom_box_arabic():
    mode, confidence, reason = main.determine_next_mode("ابني بوكس مخصص", "ar")
    assert mode == "custom_box"
    assert confidence >= 0.9

def test_determine_next_mode_dialogue():
    mode, confidence, reason = main.determine_next_mode("hello Chef", "en")
    assert mode == "dialogue"

def test_determine_next_mode_continuation():
    # Weak input keeps active custom_box mode
    mode, confidence, reason = main.determine_next_mode("make it for 2 people", "en", current_mode="custom_box")
    assert mode == "custom_box"
    assert reason == "continue_custom_box_session"

def test_determine_next_mode_interruption():
    # Strong FAQ interrupts custom_box mode
    mode, confidence, reason = main.determine_next_mode("what is your refund policy", "en", current_mode="custom_box")
    assert mode == "faq"


# ═══════════════════════════════════════════════════════════════════════════════
# 5. /chat Router Integration Tests
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_chat_recommendation_prefetch_path():
    main.FORCE_FAST_PATH = True
    
    mock_db = MagicMock()
    mock_db.chat_sessions.find_one = AsyncMock(return_value=None)
    
    rec_result = {
        "boxes": [{"id": "b1", "name": "Keto Box", "price": 200, "meals": ["Chicken"]}],
        "count": 1
    }
    
    # We mock groq completions to return the final narration directly
    mock_completion = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "Here is the Keto Box recommendation."
    mock_choice.message.tool_calls = None
    mock_completion.choices = [mock_choice]
    
    with patch("main.db", mock_db), \
         patch("main.execute_tool", new=AsyncMock(return_value=rec_result)), \
         patch("main.save_session_message", new=AsyncMock()), \
         patch("main.save_session_mode", new=AsyncMock()), \
         patch("main.groq_generate_with_retry", new=AsyncMock(return_value=mock_completion)):
         
        async with AsyncClient(transport=ASGITransport(app=main.app), base_url="http://test") as client:
            resp = await client.post("/chat", json={
                "message": "recommend a healthy keto box",
                "sessionId": "rec-test"
            })
            
        assert resp.status_code == 200
        body = resp.json()
        assert body["mode"] == "recommendation"
        assert body["source"] == "groq"
        assert "Keto Box" in body["answer"] or "recommendation" in body["answer"]
        assert len(body["toolCalls"]) == 1
        assert body["toolCalls"][0]["tool"] == "recommend_box"
        
    main.FORCE_FAST_PATH = False


@pytest.mark.asyncio
async def test_chat_explicit_custom_box_flow_endpoint():
    """An explicit flow='custom_box' enters the deterministic state machine and
    returns selectable meals — regardless of the classifier."""
    mock_db = MagicMock()
    mock_db.chat_sessions.find_one = AsyncMock(return_value=None)
    mock_db.chat_sessions.update_one = AsyncMock(return_value=None)

    menu = {"meals": [{"id": "m1", "name": "Steak", "price": 90, "calories": 300, "allergens": []}], "count": 1}

    with patch("main.db", mock_db), \
         patch("main.execute_tool", new=AsyncMock(return_value=menu)):

        async with AsyncClient(transport=ASGITransport(app=main.app), base_url="http://test") as client:
            resp = await client.post("/chat", json={
                "message": "",
                "sessionId": "explicit-bb",
                "flow": "custom_box",
                "action": {"type": "start"},
            })

    assert resp.status_code == 200
    body = resp.json()
    assert body["source"] == "build_box"
    assert body["flow"] == "custom_box"
    assert body["flowState"] == main.BB_SELECTING
    assert len(body["selectableMeals"]) == 1
    assert any(q["action"].get("type") == "set_diet" for q in body["quickActions"])


@pytest.mark.asyncio
async def test_chat_dialogue_fallback_no_tool_calls():
    main.FORCE_FAST_PATH = True
    
    mock_db = MagicMock()
    mock_db.chat_sessions.find_one = AsyncMock(return_value=None)
    
    with patch("main.db", mock_db), \
         patch("main.save_session_message", new=AsyncMock()), \
         patch("main.save_session_mode", new=AsyncMock()):
         
        async with AsyncClient(transport=ASGITransport(app=main.app), base_url="http://test") as client:
            resp = await client.post("/chat", json={
                "message": "greetings Chef! tell me a joke.",
                "sessionId": "dialogue-test"
            })
            
        assert resp.status_code == 200
        body = resp.json()
        assert body["mode"] == "dialogue"
        assert body["toolCalls"] == []
        assert "أقدر أساعدك" in body["answer"] or "recommend a meal box" in body["answer"]
        
    main.FORCE_FAST_PATH = False


# ═══════════════════════════════════════════════════════════════════════════════
# 6. Mode Switching & Interruptions Tests
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_chat_switching_faq_interrupts_custom_box():
    main.FORCE_FAST_PATH = True
    
    mock_data = [
        {
            "question_en": "what is the refund policy",
            "question_ar": "سياسة الاسترداد",
            "intent": "faq",
            "answer": "Full refund within 14 days.",
            "answer_ar": "استرداد كامل خلال ١٤ يوم."
        }
    ]
    
    mock_db = MagicMock()
    # Mocking get_session_mode to return 'custom_box'
    mock_db.chat_sessions.find_one = AsyncMock(return_value={"currentMode": "custom_box"})
    
    with patch("main.dataset", mock_data), \
         patch("main.db", mock_db), \
         patch("main.save_session_message", new=AsyncMock()), \
         patch("main.save_session_mode", new=AsyncMock()) as mock_save_mode:
         
        main._ensure_indices_built()
        
        async with AsyncClient(transport=ASGITransport(app=main.app), base_url="http://test") as client:
            resp = await client.post("/chat", json={
                "message": "what is the refund policy",
                "sessionId": "switch-faq-test"
            })
            
        assert resp.status_code == 200
        body = resp.json()
        assert body["mode"] == "faq"
        assert body["source"] == "bm25_faq"
        mock_save_mode.assert_called_with("switch-faq-test", "faq")
        
    main.FORCE_FAST_PATH = False


@pytest.mark.asyncio
async def test_chat_switching_recommendation_interrupts_custom_box():
    main.FORCE_FAST_PATH = True
    
    mock_db = MagicMock()
    mock_db.chat_sessions.find_one = AsyncMock(return_value={"currentMode": "custom_box"})
    
    rec_result = {"boxes": [], "count": 0}
    mock_completion = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "Recommendation narration"
    mock_choice.message.tool_calls = None
    mock_completion.choices = [mock_choice]
    
    with patch("main.db", mock_db), \
         patch("main.execute_tool", new=AsyncMock(return_value=rec_result)), \
         patch("main.save_session_message", new=AsyncMock()), \
         patch("main.save_session_mode", new=AsyncMock()) as mock_save_mode, \
         patch("main.groq_generate_with_retry", new=AsyncMock(return_value=mock_completion)):
         
        async with AsyncClient(transport=ASGITransport(app=main.app), base_url="http://test") as client:
            resp = await client.post("/chat", json={
                "message": "actually recommend a keto box",
                "sessionId": "switch-rec-test"
            })
            
        assert resp.status_code == 200
        body = resp.json()
        assert body["mode"] == "recommendation"
        mock_save_mode.assert_called_with("switch-rec-test", "recommendation")
        
    main.FORCE_FAST_PATH = False


@pytest.mark.asyncio
async def test_chat_switching_continuation_in_custom_box():
    main.FORCE_FAST_PATH = True
    
    mock_db = MagicMock()
    mock_db.chat_sessions.find_one = AsyncMock(return_value={"currentMode": "custom_box"})
    
    meals_result = {"meals": [], "count": 0}
    mock_completion = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "Steak box details"
    mock_choice.message.tool_calls = None
    mock_completion.choices = [mock_choice]
    
    with patch("main.db", mock_db), \
         patch("main.execute_tool", new=AsyncMock(return_value=meals_result)), \
         patch("main.save_session_message", new=AsyncMock()), \
         patch("main.save_session_mode", new=AsyncMock()) as mock_save_mode, \
         patch("main.groq_generate_with_retry", new=AsyncMock(return_value=mock_completion)):
         
        async with AsyncClient(transport=ASGITransport(app=main.app), base_url="http://test") as client:
            # Weak filler query should continue in custom_box
            resp = await client.post("/chat", json={
                "message": "make it weekly for 2 people",
                "sessionId": "switch-cont-test"
            })
            
        assert resp.status_code == 200
        body = resp.json()
        assert body["mode"] == "custom_box"
        mock_save_mode.assert_called_with("switch-cont-test", "custom_box")

    main.FORCE_FAST_PATH = False


# ═══════════════════════════════════════════════════════════════════════════════
# 7. Build-a-Box Deterministic State Machine (unit)
# ═══════════════════════════════════════════════════════════════════════════════
# These call handle_custom_box_flow directly. narrate_step returns the canonical
# text under pytest, so assertions are deterministic. save_session_message no-ops
# because db is None at module load.

def _req(message="", action=None):
    return main.ChatRequest(message=message, session_id="bb", user_token="tok",
                            flow="custom_box", action=action)

MENU = [
    {"id": "m1", "name": "Steak", "price": 90, "calories": 300, "allergens": []},
    {"id": "m2", "name": "Salad", "price": 50, "calories": 150, "allergens": ["nuts"]},
]


@pytest.mark.asyncio
async def test_bb_start_lists_selectable_meals():
    with patch("main.execute_tool", new=AsyncMock(return_value={"meals": MENU, "count": 2})):
        action = {"type": "start"}
        resp, state = await main.handle_custom_box_flow(_req(action=action), "bb", "tok", "en", {}, action)
    assert resp["flow"] == "custom_box"
    assert resp["flowState"] == main.BB_SELECTING
    assert len(resp["selectableMeals"]) == 2
    assert any(q["action"].get("type") == "set_diet" for q in resp["quickActions"])
    assert state["step"] == main.BB_SELECTING


@pytest.mark.asyncio
async def test_bb_add_meal_and_qty_caps():
    state = {"step": main.BB_SELECTING, "selection": {}, "dietFilter": "all", "menu": MENU}
    action = {"type": "add_meal", "mealId": "m1"}
    resp, state = await main.handle_custom_box_flow(_req(action=action), "bb", "tok", "en", state, action)
    assert state["selection"]["m1"]["qty"] == 1
    # Per-meal cap is enforced
    for _ in range(5):
        action = {"type": "change_qty", "mealId": "m1", "delta": 1}
        resp, state = await main.handle_custom_box_flow(_req(action=action), "bb", "tok", "en", state, action)
    assert state["selection"]["m1"]["qty"] == main.MAX_QTY_PER_MEAL
    # Removing past zero drops the meal
    for _ in range(main.MAX_QTY_PER_MEAL):
        action = {"type": "change_qty", "mealId": "m1", "delta": -1}
        resp, state = await main.handle_custom_box_flow(_req(action=action), "bb", "tok", "en", state, action)
    assert "m1" not in state["selection"]


@pytest.mark.asyncio
async def test_bb_done_selecting_requires_one_meal():
    state = {"step": main.BB_SELECTING, "selection": {}, "dietFilter": "all", "menu": MENU}
    action = {"type": "done_selecting"}
    resp, state = await main.handle_custom_box_flow(_req(action=action), "bb", "tok", "en", state, action)
    # Empty selection keeps us in SELECTING
    assert resp["flowState"] == main.BB_SELECTING
    assert state["step"] == main.BB_SELECTING


@pytest.mark.asyncio
async def test_bb_done_selecting_advances_to_serving():
    state = {"step": main.BB_SELECTING, "dietFilter": "all", "menu": MENU,
             "selection": {"m1": {"name": "Steak", "price": 90, "qty": 1}}}
    action = {"type": "done_selecting"}
    resp, state = await main.handle_custom_box_flow(_req(action=action), "bb", "tok", "en", state, action)
    assert resp["flowState"] == main.BB_SERVING
    assert any(q["action"].get("type") == "set_serving" for q in resp["quickActions"])


@pytest.mark.asyncio
async def test_bb_serving_advances_to_purchase():
    state = {"step": main.BB_SERVING, "dietFilter": "all", "menu": MENU,
             "selection": {"m1": {"name": "Steak", "price": 90, "qty": 1}}}
    action = {"type": "set_serving", "size": 2}
    resp, state = await main.handle_custom_box_flow(_req(action=action), "bb", "tok", "en", state, action)
    assert state["servingSize"] == 2
    assert resp["flowState"] == main.BB_PURCHASE
    assert any(q["action"].get("type") == "set_purchase" for q in resp["quickActions"])


@pytest.mark.asyncio
async def test_bb_purchase_advances_to_confirm_with_price():
    state = {"step": main.BB_PURCHASE, "dietFilter": "all", "menu": MENU, "servingSize": 2,
             "selection": {"m1": {"name": "Steak", "price": 90, "qty": 1}}}
    preview = {"priceForServingSize": 162, "totalCalories": 600, "allergens": []}
    with patch("main._calculate_custom_box", new=AsyncMock(return_value=preview)):
        action = {"type": "set_purchase", "mode": "one_time"}
        resp, state = await main.handle_custom_box_flow(_req(action=action), "bb", "tok", "en", state, action)
    assert state["purchaseType"] == "one_time"
    assert resp["flowState"] == main.BB_CONFIRM
    assert resp["priceInfo"]["totalPrice"] == 162
    assert any(q["action"].get("type") == "confirm" for q in resp["quickActions"])


@pytest.mark.asyncio
async def test_bb_confirm_one_time_creates_box_and_cart():
    def side(tool, args, token, lang):
        if tool == "create_custom_box":
            return {"success": True, "boxId": "box_1", "name": "Custom", "price": 162}
        if tool == "add_to_cart":
            return {"success": True, "cartTotal": 162}
        return {}
    state = {"step": main.BB_CONFIRM, "servingSize": 2, "purchaseType": "one_time",
             "priceInfo": {"totalPrice": 162},
             "selection": {"m1": {"name": "Steak", "price": 90, "qty": 1}}}
    with patch("main.execute_tool", new=AsyncMock(side_effect=side)):
        action = {"type": "confirm"}
        resp, state = await main.handle_custom_box_flow(_req(action=action), "bb", "tok", "en", state, action)
    assert state is None  # flow ended → lock released
    assert resp["flow"] is None
    names = [tc["tool"] for tc in resp["toolCalls"]]
    assert "create_custom_box" in names and "add_to_cart" in names


@pytest.mark.asyncio
async def test_bb_confirm_subscription_creates_box_and_subscription():
    def side(tool, args, token, lang):
        if tool == "create_custom_box":
            return {"success": True, "boxId": "box_1"}
        if tool == "create_subscription":
            return {"success": True, "subscriptionId": "sub_1"}
        return {}
    state = {"step": main.BB_CONFIRM, "servingSize": 4, "purchaseType": "weekly",
             "priceInfo": {"totalPrice": 288},
             "selection": {"m1": {"name": "Steak", "price": 90, "qty": 1}}}
    with patch("main.execute_tool", new=AsyncMock(side_effect=side)):
        action = {"type": "confirm"}
        resp, state = await main.handle_custom_box_flow(_req(action=action), "bb", "tok", "en", state, action)
    assert state is None
    names = [tc["tool"] for tc in resp["toolCalls"]]
    assert "create_custom_box" in names and "create_subscription" in names


@pytest.mark.asyncio
async def test_bb_confirm_requires_login():
    state = {"step": main.BB_CONFIRM, "servingSize": 2, "purchaseType": "one_time",
             "priceInfo": {"totalPrice": 162},
             "selection": {"m1": {"name": "Steak", "price": 90, "qty": 1}}}
    # No user_token → must not create anything, stays at CONFIRM
    with patch("main.execute_tool", new=AsyncMock()) as exec_mock:
        action = {"type": "confirm"}
        resp, state = await main.handle_custom_box_flow(
            main.ChatRequest(message="", session_id="bb", user_token=None, flow="custom_box", action=action),
            "bb", None, "en", state, action)
    assert state is not None and state["step"] == main.BB_CONFIRM
    exec_mock.assert_not_called()


@pytest.mark.asyncio
async def test_bb_cancel_ends_flow():
    state = {"step": main.BB_SELECTING, "dietFilter": "all", "menu": MENU,
             "selection": {"m1": {"name": "Steak", "price": 90, "qty": 1}}}
    action = {"type": "cancel"}
    resp, state = await main.handle_custom_box_flow(_req(action=action), "bb", "tok", "en", state, action)
    assert state is None
    assert resp["flow"] is None

