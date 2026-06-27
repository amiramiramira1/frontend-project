# Rebuild the AI-service Build-a-Box flow (deterministic, button-driven)

## Context

The Boxify chatbot routes every message through a keyword + BM25 classifier
(`determine_next_mode`, `ai-service/main.py:398`) that decides per-turn whether the
user wants FAQ, a recommendation, a custom box, or general dialogue. Because the
LLM/classifier re-guesses intent on every message, it frequently picks the wrong
task. The **Build-a-Box** experience is effectively non-functional:

- The "🛠️ Build my own box" button (`frontend/src/components/Chatbot.jsx:55`) only
  sends plain text; no intent is signalled. The backend proxy
  (`backend/chatbot.js:45`) forwards just `message`/`session_id`/`user_token`.
- The custom-box "fast path" only advances if the user literally types `meal_xxxx`
  IDs (`_extract_meal_ids`, `main.py:1569`), which never happens. So
  `_custom_box_prefetch_args` always falls into `get_available_meals` and just
  dumps the meal list — one step of a 7-step flow — then stalls.
- The chat meal list (`renderMealList`, `Chatbot.jsx:217`) is **read-only**: there
  is no way to actually select a meal, set a serving size, choose one-time vs
  subscription, or create the box.

The canonical full flow already exists as a page-based UI in
`frontend/src/pages/BuildBoxPage.jsx` (diet filter → browse meals → add/qty →
price preview via `/api/boxes/custom/calculate` → serving size → add to cart /
subscribe). We will mirror that as a **deterministic, button-locked chat flow**.

**Outcome:** pressing "Build a box" enters a fixed, reliable state machine that
walks the user through every step and ends with a created box added to cart (or a
subscription) — no LLM task-guessing.

## Decisions (confirmed with user)

1. **Meal selection:** interactive Add / ＋ / − buttons on chat meal cards + a
   running selection summary, with typed meal names/numbers as a fallback.
2. **Flow engine:** a deterministic Python state machine drives every transition;
   a dedicated **fixed build-box system prompt** is used only to narrate each
   step's canonical message more naturally (with templated fallback if the LLM
   call fails). The machine — not the model — decides steps.
3. **Routing scope:** every quick-action button sends an explicit `flow` tag that
   the AI service obeys and **locks** until the flow completes or is cancelled.
   Free-typed messages still use the existing classifier.
4. **Testing:** Playwright MCP against the running stack, logged in with a
   user-provided test account.

## Prerequisite (blocking the Playwright step)

- Test account **email + password** (existing, email-verified) on the dev DB.
  Build-a-box's create/cart/subscribe calls are auth-gated (`createCustomBox`
  requires `req.user`, `boxRoutes.js:22`).

## Wire-protocol changes

Add two optional fields end-to-end so the UI can drive the machine without NLP:

- **Frontend → backend** (`POST /api/chatbot/chat`): add `flow` (e.g.
  `"custom_box"`) and `action` (structured, e.g.
  `{type:"add_meal", mealId, delta}`, `{type:"done_selecting"}`,
  `{type:"set_serving", size}`, `{type:"set_purchase", mode:"one_time"|"weekly"|"monthly"}`,
  `{type:"confirm"}`, `{type:"cancel"}`).
- **Backend proxy** (`backend/chatbot.js`): forward `flow` and `action` in the
  body sent to the AI service.
- **AI service** (`ChatRequest`, `main.py:1050`): accept `flow: Optional[str]` and
  `action: Optional[dict]`.

## AI-service changes (`ai-service/main.py`)

1. **Session flow state.** Extend the chat_session doc with a `customBox`
   sub-state: `step`, `selection` (mealId → qty), `dietFilter`, `servingSize`,
   `purchaseType`. Add `get_flow_state` / `save_flow_state` helpers next to the
   existing `get_session_mode` / `save_session_mode` (`main.py:942`).

2. **Dispatch.** In `chat()` (`main.py:1234`), before the classifier:
   if `req.flow == "custom_box"` (or session `currentFlow == "custom_box"`),
   route to the new `handle_custom_box_flow(...)` state machine and return.
   Honor `req.flow` for `recommendation`/`faq` as a one-shot override that skips
   `determine_next_mode`. Otherwise fall through to the existing logic.

3. **State machine `handle_custom_box_flow`** — steps:
   `START → ASK_DIET → SHOW_MEALS/SELECTING → ASK_SERVING → ASK_PURCHASE_TYPE →
   CONFIRM → CREATE`.
   - Reuses `execute_tool("get_available_meals", {dietType})` for the menu and
     `create_custom_box` / `add_to_cart` / `create_subscription` at the end.
   - Adds a `_calculate_custom_box(mealIds, servingSize)` helper that calls
     `POST {BACKEND_URL}/api/boxes/custom/calculate` (`boxController.js:233`) for
     the live price/calorie/allergen preview.
   - Applies the same guardrails as `BuildBoxPage` (`MAX_QTY_PER_MEAL=3`,
     `MAX_TOTAL_MEALS=10`).
   - Each step returns deterministic **structured UI data** (selectable meals
     with `selectedQty`, serving-size chips, purchase-type chips, confirm/cancel
     chips, price summary) plus a `flow`/`flowState` marker. The structured data
     is never LLM-generated.

4. **Fixed narration prompt.** Add `BUILD_BOX_SYSTEM_PROMPT` and a
   `narrate_step(canonical_text, lang)` helper that asks the LLM (dedicated
   system prompt, no tools) to rephrase the canonical step message in the user's
   language, 1–2 sentences, inventing nothing. On any failure, return the
   canonical templated text verbatim.

5. **Retire the brittle path.** Remove the old `intent == 'custom_box'` fast-path
   block (`main.py:1332`) and the meal-ID-dependent `_custom_box_prefetch_args`
   (`main.py:1592`). Keep `determine_next_mode` for free-typed messages.

## Frontend changes (`frontend/src/components/Chatbot.jsx`)

- `sendMessage` accepts optional `{ flow, action }` and includes them in the POST
  body alongside `message`.
- Quick-action buttons send explicit flows: Build → `flow:"custom_box"`,
  `action:{type:"start"}`; Recommend → `flow:"recommendation"`; Ask → `flow:"faq"`
  hint on the next typed message.
- `renderMealList`: when the response marks meals `selectable`, render Add / ＋ / −
  controls and a per-meal `×qty` badge; clicking dispatches
  `action:{type:"add_meal"|"change_qty", mealId, delta}`. Show the running
  selection summary + live total, with a "Done selecting →" button.
- Render new chip groups (serving size, purchase type, confirm/cancel) from a
  structured `quickActions` array whose entries carry an `action` payload instead
  of free text.
- Reuse existing `boxCreated` / `cartAdded` / `subscriptionCreated` renderers for
  the final confirmation.

## Tests

- Update `ai-service/tests/test_router.py` / `test_chatbot.py`: drop the old
  meal-ID custom-box assertions; add unit tests for each state transition of
  `handle_custom_box_flow` (start, diet filter, add/qty caps, done→serving,
  serving→purchase, purchase→confirm, confirm→create+cart, confirm→create+subscribe,
  cancel) with `db` and `execute_tool` mocked. Assert the structured UI payload at
  each step and that no classifier is invoked when `flow="custom_box"`.
- Keep `narrate_step` behind a mock so tests stay offline/deterministic.

## Verification

1. `cd ai-service && python -m pytest tests/ -q` — all green.
2. Start the stack: `npm run dev` (frontend 5173, backend 5000, ai-service 8000;
   MongoDB reachable).
3. **Playwright MCP** end-to-end (needs the test account):
   - Open the site, log in, open the chat, click **🛠️ Build my own box**.
   - Verify the deterministic steps: diet prompt → meal list with working Add/＋/−
     → selection summary + live price → serving-size chips → one-time/subscription
     chips → confirm → "box created + added to cart" (and a separate run for the
     subscription branch).
   - Confirm the flow stays locked (a mid-flow off-topic line doesn't derail it)
     and that **Cancel** exits cleanly.
4. Sanity-check that Recommend and Ask buttons still behave, and free-typed FAQ /
   recommendation messages still route via the existing classifier.
