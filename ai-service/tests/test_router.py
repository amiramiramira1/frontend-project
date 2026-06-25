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
