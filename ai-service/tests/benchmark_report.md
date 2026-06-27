# Boxify AI Service — Model Evaluation Report
Generated on: 2026-06-23 18:52:01

This report evaluates different Google Gemini models for the Boxify AI service using the live Gemini API.
Each model was tested across 7 core agent scenarios evaluating tool calling correctness, language auto-detection, and response latency.

## Summary Table

| Model Name | Success Rate | Tool Accuracy | Lang Consistency | Avg Latency | Score |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `gemini-2.5-flash-lite` | 14% | 14% | 14% | 8.28s | 0.0/100 |
| `gemini-2.5-flash` | 57% | 43% | 43% | 3.47s | 40.8/100 |
| `gemini-2.5-pro` | 14% | 0% | 14% | 4.38s | 0.0/100 |
| `gemini-2.0-flash` | 14% | 0% | 14% | 4.47s | 0.0/100 |

### Recommendation: **gemini-2.5-flash**
Based on the automatic scoring weighting latency, tool call accuracy, and language auto-detection, `gemini-2.5-flash` is currently the recommended model.

## Detailed Scenario Results

### Model: `gemini-2.5-flash-lite`

| Scenario | Expected Tool | Expected Lang | Actual Tool Called | Lang Match | Latency | Status |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: |
| FAQ Search (Delivery) | `search_faq` | EN | `search_faq` | ✅ | 14.55s | ✅ PASS |
| Recommend Box (Keto) | `recommend_box` | EN | `None` | ❌ | 19.68s | ❌ FAIL |
| Get Available Meals (Standard) | `get_available_meals` | EN | `None` | ❌ | 5.17s | ❌ FAIL |
| Create Custom Box (Confirm) | `create_custom_box` | EN | `None` | ❌ | 5.26s | ❌ FAIL |
| Add to Cart (Explicit) | `add_to_cart` | EN | `None` | ❌ | 3.75s | ❌ FAIL |
| Create Subscription (Weekly) | `create_subscription` | EN | `None` | ❌ | 4.65s | ❌ FAIL |
| Arabic Request (Subscription) | `create_subscription` | AR | `None` | ❌ | 4.93s | ❌ FAIL |

### Model: `gemini-2.5-flash`

| Scenario | Expected Tool | Expected Lang | Actual Tool Called | Lang Match | Latency | Status |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: |
| FAQ Search (Delivery) | `search_faq` | EN | `search_faq` | ✅ | 2.30s | ✅ PASS |
| Recommend Box (Keto) | `recommend_box` | EN | `recommend_box` | ✅ | 2.17s | ✅ PASS |
| Get Available Meals (Standard) | `get_available_meals` | EN | `get_available_meals` | ❌ | 2.14s | ❌ FAIL |
| Create Custom Box (Confirm) | `create_custom_box` | EN | `None` | ✅ | 3.39s | ❌ FAIL |
| Add to Cart (Explicit) | `add_to_cart` | EN | `None` | ❌ | 5.29s | ❌ FAIL |
| Create Subscription (Weekly) | `create_subscription` | EN | `None` | ❌ | 4.63s | ❌ FAIL |
| Arabic Request (Subscription) | `create_subscription` | AR | `None` | ❌ | 4.40s | ❌ FAIL |

### Model: `gemini-2.5-pro`

| Scenario | Expected Tool | Expected Lang | Actual Tool Called | Lang Match | Latency | Status |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: |
| FAQ Search (Delivery) | `search_faq` | EN | `None` | ✅ | 4.24s | ❌ FAIL |
| Recommend Box (Keto) | `recommend_box` | EN | `None` | ❌ | 4.45s | ❌ FAIL |
| Get Available Meals (Standard) | `get_available_meals` | EN | `None` | ❌ | 5.01s | ❌ FAIL |
| Create Custom Box (Confirm) | `create_custom_box` | EN | `None` | ❌ | 4.12s | ❌ FAIL |
| Add to Cart (Explicit) | `add_to_cart` | EN | `None` | ❌ | 4.16s | ❌ FAIL |
| Create Subscription (Weekly) | `create_subscription` | EN | `None` | ❌ | 3.87s | ❌ FAIL |
| Arabic Request (Subscription) | `create_subscription` | AR | `None` | ❌ | 4.79s | ❌ FAIL |

### Model: `gemini-2.0-flash`

| Scenario | Expected Tool | Expected Lang | Actual Tool Called | Lang Match | Latency | Status |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: |
| FAQ Search (Delivery) | `search_faq` | EN | `None` | ✅ | 4.68s | ❌ FAIL |
| Recommend Box (Keto) | `recommend_box` | EN | `None` | ❌ | 4.10s | ❌ FAIL |
| Get Available Meals (Standard) | `get_available_meals` | EN | `None` | ❌ | 4.09s | ❌ FAIL |
| Create Custom Box (Confirm) | `create_custom_box` | EN | `None` | ❌ | 4.71s | ❌ FAIL |
| Add to Cart (Explicit) | `add_to_cart` | EN | `None` | ❌ | 4.90s | ❌ FAIL |
| Create Subscription (Weekly) | `create_subscription` | EN | `None` | ❌ | 4.43s | ❌ FAIL |
| Arabic Request (Subscription) | `create_subscription` | AR | `None` | ❌ | 4.37s | ❌ FAIL |
