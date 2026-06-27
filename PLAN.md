# Boxify Chatbot Mode Switching Upgrade

## Summary
Add a first-class `custom_box` mode so the chatbot switches reliably between `faq`, `recommendation`, `custom_box`, and `dialogue`. Preserve the current fast paths for FAQ and recommendations, but make custom box building explicit, state-aware, and testable while still using the existing ReAct/tool loop for meal lookup, creation, cart, and subscription steps.

## Key Changes
- Replace/extend `classify_intent()` with a router that returns `mode`, `confidence`, and `reason`.
- Supported modes:
  - `faq`: policy, delivery, refund, cancellation, subscription, payment, pricing questions.
  - `recommendation`: requests for pre-made box suggestions.
  - `custom_box`: build-your-own-box, meal selection, serving-size/frequency confirmation, custom box creation.
  - `dialogue`: greetings, unclear filler, service explanation, and off-topic guardrail responses.
- Keep FAQ flow:
  - `faq -> search_faq() -> save user/model messages -> direct response`.
  - Return `source: "bm25_faq"` and empty `toolCalls`.
- Keep recommendation flow:
  - `recommendation -> recommend_box prefetch -> cosine re-ranking -> LLM narration`.
  - Improve preference extraction for diet, allergens, budget, and light/healthy wording before ranking.
- Add custom-box flow:
  - `custom_box` start calls or guides toward `get_available_meals`.
  - Direct meal mentions trigger meal lookup before creation.
  - Creation tools run only after meal IDs plus user confirmation are present.
  - If subscription is requested, call `create_subscription` after `create_custom_box`; otherwise add to cart when appropriate.
- Add session-aware switching:
  - Continue custom-box flow across follow-ups like “make it weekly” or “2 people”.
  - Allow strong new intents to interrupt, e.g. “actually recommend a keto box”.
  - Treat weak or ambiguous messages as current flow continuation when a custom-box flow is active.
- Preserve existing API shape and add optional metadata:
  - Keep `answer`, `source`, `toolCalls`, `model`.
  - Add `mode` and `modeConfidence` for debugging/frontend use.

## Test Plan
- Add router unit tests for English and Arabic mode detection.
- Add integration tests for:
  - FAQ direct BM25 response.
  - Recommendation prefetch and `recommend_box` toolCalls.
  - Custom-box start triggering `get_available_meals`.
  - Confirmed meal IDs triggering `create_custom_box`.
  - Weekly/monthly custom box triggering `create_subscription`.
  - Dialogue/off-topic message returning no tool calls.
- Add switching tests:
  - FAQ interrupts recommendation/custom-box flow.
  - Recommendation interrupts custom-box flow.
  - Custom-box follow-up remains in `custom_box`.
- Run: `pytest tests/test_router.py tests/test_chatbot.py`.

## Assumptions
- Custom box building should become an explicit router mode.
- Frontend manual mode controls are not required.
- Existing backend proxy and React rich rendering stay unchanged unless later UI mode indicators are requested.
