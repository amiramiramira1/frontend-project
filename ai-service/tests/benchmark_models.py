"""
tests/benchmark_models.py
=========================
A benchmarking script to evaluate and compare different Gemini models
running inside the Boxify AI Service.

This script runs 7 standard scenarios testing all functions the AI is supposed
to do (FAQ, recommendations, custom boxes, cart actions, subscriptions, Arabic
auto-detection) across various models:
  - gemini-2.5-flash-lite (current default)
  - gemini-2.5-flash
  - gemini-2.5-pro
  - gemini-2.0-flash

It outputs an evaluation table and saves a detailed report to `benchmark_report.md`.

Run with:
    python ai-service/tests/benchmark_models.py
"""

import os
import sys
import time
import asyncio
import json
from dotenv import load_dotenv
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport

# Reconfigure stdout/stderr to UTF-8 to prevent UnicodeEncodeError on Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Ensure the package root is in sys.path
AI_SERVICE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if AI_SERVICE_DIR not in sys.path:
    sys.path.insert(0, AI_SERVICE_DIR)

# Load environment variables
load_dotenv(os.path.join(AI_SERVICE_DIR, ".env"))

# SCENARIOS DEFINITIONS
SCENARIOS = [
    {
        "name": "FAQ Search (Delivery)",
        "message": "What is the delivery policy?",
        "expected_tool": "search_faq",
        "expected_lang": "en"
    },
    {
        "name": "Recommend Box (Keto)",
        "message": "Can you suggest a keto box under 200 EGP?",
        "expected_tool": "recommend_box",
        "expected_lang": "en"
    },
    {
        "name": "Get Available Meals (Standard)",
        "message": "I'd like to build my own box. Show me standard meals.",
        "expected_tool": "get_available_meals",
        "expected_lang": "en"
    },
    {
        "name": "Create Custom Box (Confirm)",
        "message": "Create a custom box with meals meal_1 and meal_2 named 'Chef Classic'.",
        "expected_tool": "create_custom_box",
        "expected_lang": "en"
    },
    {
        "name": "Add to Cart (Explicit)",
        "message": "Please add box box_987 with serving size 2 to my cart.",
        "expected_tool": "add_to_cart",
        "expected_lang": "en"
    },
    {
        "name": "Create Subscription (Weekly)",
        "message": "Subscribe me to box box_555 weekly with serving size 4.",
        "expected_tool": "create_subscription",
        "expected_lang": "en"
    },
    {
        "name": "Arabic Request (Subscription)",
        "message": "عايز اشتراك اسبوعي لعلبة box_123 وحجم 2 لو سمحت",
        "expected_tool": "create_subscription",
        "expected_lang": "ar"
    }
]

MODELS_TO_TEST = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
]

# ── MOCK SYSTEM ───────────────────────────────────────────────────────────────

def get_mock_db():
    db = MagicMock()
    db.chat_sessions.find_one = AsyncMock(return_value=None)
    db.chat_sessions.update_one = AsyncMock(return_value=None)
    db.chat_sessions.delete_one = AsyncMock(return_value=None)
    
    fake_meal = {
        "_id": "meal_id_abc",
        "name": "Grilled Steak & Broccoli",
        "description": "Premium steak and green broccoli",
        "dietType": "keto",
        "pricePerServing": 120.0,
        "caloriesPerServing": 550,
        "allergens": []
    }
    mock_cursor = MagicMock()
    mock_cursor.to_list = AsyncMock(return_value=[fake_meal])
    db.meals.find.return_value = mock_cursor
    return db

def get_mock_backend():
    mock_client = AsyncMock()
    
    # Recommend box response
    mock_get_resp = MagicMock()
    mock_get_resp.status_code = 200
    mock_get_resp.json.return_value = {
        "boxes": [{
            "_id": "box_keto_123",
            "name": "Keto Box",
            "description": "Tasty keto meals",
            "dietType": "keto",
            "priceForServing": 150.0,
            "basePrice": 140.0,
            "image": "http://example.com/keto.jpg",
            "meals": [{"name": "Steak"}]
        }]
    }
    mock_client.get.return_value = mock_get_resp
    
    # Post responses
    mock_post_resp = MagicMock()
    mock_post_resp.status_code = 200
    mock_post_resp._json_data = {
        "success": True,
        "box": {"_id": "box_custom_789", "name": "Custom Box"},
        "priceForServing": 140.0,
        "message": "Action completed successfully",
        "cart": {"cartTotal": 280.0},
        "subscription": {"_id": "sub_xyz_789"}
    }
    mock_post_resp.json.side_effect = lambda: mock_post_resp._json_data
    mock_client.post.return_value = mock_post_resp
    
    mock_cm = MagicMock()
    mock_cm.__aenter__ = AsyncMock(return_value=mock_client)
    mock_cm.__aexit__ = AsyncMock(return_value=False)
    return mock_client, mock_cm


# ── EVALUATION RUNNER ─────────────────────────────────────────────────────────

async def run_scenario(client, model, scenario):
    """Run a single test scenario against a model."""
    start_time = time.time()
    try:
        resp = await client.post("/chat", json={
            "message": scenario["message"],
            "sessionId": f"benchmark-{model}-{scenario['name'].replace(' ', '_')}",
            "userToken": "benchmark_token_123",
            "model": model
        })
        latency = time.time() - start_time
        
        if resp.status_code != 200:
            return {
                "success": False,
                "error": f"HTTP {resp.status_code}: {resp.text}",
                "latency": latency,
                "tool_match": False,
                "lang_match": False,
                "answer": "",
                "tool_calls": []
            }
            
        data = resp.json()
        if data.get("source") == "error":
            return {
                "success": False,
                "error": data.get("answer", "Unknown error source"),
                "latency": latency,
                "tool_match": False,
                "lang_match": False,
                "answer": data.get("answer", ""),
                "tool_calls": data.get("toolCalls", [])
            }
            
        answer = data.get("answer", "")
        tool_calls = data.get("toolCalls", [])
        
        # Verify Tool Matching
        tool_match = any(tc["tool"] == scenario["expected_tool"] for tc in tool_calls)
        
        # Verify Language matching
        has_arabic = any("\u0600" <= c <= "\u06FF" for c in answer)
        lang_match = (scenario["expected_lang"] == "ar" and has_arabic) or \
                     (scenario["expected_lang"] == "en" and not has_arabic)
                     
        return {
            "success": True,
            "latency": latency,
            "tool_match": tool_match,
            "lang_match": lang_match,
            "answer": answer,
            "tool_calls": tool_calls
        }
    except Exception as e:
        latency = time.time() - start_time
        return {
            "success": False,
            "error": str(e),
            "latency": latency,
            "tool_match": False,
            "lang_match": False,
            "answer": "",
            "tool_calls": []
        }

async def main_async():
    if not os.getenv("GEMINI_API_KEY"):
        print("❌ Error: GEMINI_API_KEY is not set in environment or .env file.")
        sys.exit(1)
        
    print("🚀 Starting Gemini Model Benchmark for Boxify AI Service...")
    print(f"Testing models: {', '.join(MODELS_TO_TEST)}")
    print(f"Running {len(SCENARIOS)} scenarios per model.")
    print("-" * 60)
    
    import main
    
    mock_db = get_mock_db()
    mock_client, mock_cm = get_mock_backend()
    
    results = {}
    
    # Patch main dataset for FAQ matching
    with (
        patch("main.db", mock_db),
        patch("httpx.AsyncClient", return_value=mock_cm),
        patch("main.dataset", [{
            "question_en": "what is the delivery policy",
            "question_ar": "ما هي سياسة التوصيل",
            "answer": "We deliver everywhere in Egypt in 48 hours.",
            "answer_ar": "نوصل لكل مكان في مصر خلال ٤٨ ساعة.",
        }])
    ):
        async with AsyncClient(transport=ASGITransport(app=main.app), base_url="http://test") as client:
            for model in MODELS_TO_TEST:
                print(f"Evaluating model: {model}...")
                model_results = []
                for sc in SCENARIOS:
                    print(f"  - Scenario: {sc['name']}...", end="", flush=True)
                    res = await run_scenario(client, model, sc)
                    model_results.append((sc, res))
                    if res["success"]:
                        status = "✅ PASS" if (res["tool_match"] and res["lang_match"]) else "⚠️ PARTIAL"
                        print(f" {status} ({res['latency']:.2f}s)")
                    else:
                        print(f" ❌ FAIL: {res.get('error', 'Error')}")
                results[model] = model_results
                print("-" * 60)

    # ── GENERATE REPORT ───────────────────────────────────────────────────────
    
    report_lines = [
        "# Boxify AI Service — Model Evaluation Report",
        f"Generated on: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "This report evaluates different Google Gemini models for the Boxify AI service using the live Gemini API.",
        "Each model was tested across 7 core agent scenarios evaluating tool calling correctness, language auto-detection, and response latency.",
        "",
        "## Summary Table",
        "",
        "| Model Name | Success Rate | Tool Accuracy | Lang Consistency | Avg Latency | Score |",
        "| :--- | :---: | :---: | :---: | :---: | :---: |"
    ]
    
    model_scores = {}
    for model, m_res in results.items():
        total = len(m_res)
        successes = sum(1 for sc, r in m_res if r["success"])
        tool_correct = sum(1 for sc, r in m_res if r.get("tool_match"))
        lang_correct = sum(1 for sc, r in m_res if r.get("lang_match"))
        avg_latency = sum(r["latency"] for sc, r in m_res) / total
        
        success_rate = (successes / total) * 100
        tool_accuracy = (tool_correct / total) * 100
        lang_fidelity = (lang_correct / total) * 100
        
        # Calculate a weighted score out of 100
        # 50% tool call, 30% language, 20% success/no crash, penalty for latency > 5s
        score = (tool_accuracy * 0.5) + (lang_fidelity * 0.3) + (success_rate * 0.2)
        latency_penalty = max(0, (avg_latency - 2.5) * 5)  # deduct 5 points per second above 2.5s
        final_score = max(0, min(100, score - latency_penalty))
        model_scores[model] = final_score
        
        report_lines.append(
            f"| `{model}` | {success_rate:.0f}% | {tool_accuracy:.0f}% | {lang_fidelity:.0f}% | {avg_latency:.2f}s | {final_score:.1f}/100 |"
        )
        
    best_model = max(model_scores, key=model_scores.get)
    
    report_lines.extend([
        "",
        f"### Recommendation: **{best_model}**",
        f"Based on the automatic scoring weighting latency, tool call accuracy, and language auto-detection, `{best_model}` is currently the recommended model.",
        "",
        "## Detailed Scenario Results",
        ""
    ])
    
    for model, m_res in results.items():
        report_lines.extend([
            f"### Model: `{model}`",
            "",
            "| Scenario | Expected Tool | Expected Lang | Actual Tool Called | Lang Match | Latency | Status |",
            "| :--- | :--- | :---: | :--- | :---: | :---: | :---: |"
        ])
        for sc, r in m_res:
            actual_tools = ", ".join(tc["tool"] for tc in r.get("tool_calls", [])) if r.get("tool_calls") else "None"
            lang_match_str = "✅" if r.get("lang_match") else "❌"
            tool_match_str = "✅" if r.get("tool_match") else "❌"
            status_str = "✅ PASS" if (r["success"] and r["tool_match"] and r["lang_match"]) else "❌ FAIL"
            report_lines.append(
                f"| {sc['name']} | `{sc['expected_tool']}` | {sc['expected_lang'].upper()} | `{actual_tools}` | {lang_match_str} | {r['latency']:.2f}s | {status_str} |"
            )
        report_lines.append("")
        
    # Write to file
    report_path = os.path.join(AI_SERVICE_DIR, "tests", "benchmark_report.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))
        
    print(f"\n🎉 Benchmark complete! Report generated at: {report_path}")
    print(f"Recommended Model: {best_model} (Score: {model_scores[best_model]:.1f}/100)")

if __name__ == "__main__":
    asyncio.run(main_async())
