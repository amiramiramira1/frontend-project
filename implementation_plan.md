# Boxify AI Service — Similarity Upgrade Implementation Plan

> **Scope:** `ai-service/main.py` and `backend/controllers/boxController.js`  
> **Goal:** Replace ad-hoc fuzzy matching with principled similarity methods, add intent routing, fix the async blocking crash, and lay the groundwork for RAG.  
> **Effort estimate:** 4 phases, ~2–3 days total of focused work.

---

## Context: What the Code Actually Does Today

Before touching anything, here is a precise audit of every "search" operation in the current system and what similarity method powers it:

| Location | Operation | Current Method | Problem |
|---|---|---|---|
| `main.py` → `search_faq()` Stage 1 | FAQ candidate filter | Unnormalized word overlap (Jaccard without denominator) | Common words score the same as rare, meaningful ones |
| `main.py` → `search_faq()` Stage 2 | FAQ re-ranking | `difflib.SequenceMatcher` (Ratcliff/Obershelp character similarity) | Finds "شحن" ≈ "الشحن" but fails on "cancel" vs "stop delivery" |
| `main.py` → `/chat` endpoint | LLM call | `gemini_client.models.generate_content(...)` — **synchronous, blocking** | Freezes the entire event loop; root cause of the traffic crashes |
| `boxController.js` → `scoreBox()` | Box ranking | Manual weighted sum of 4 binary/normalized features | Already good; the AI tool doesn't pass conversation context to it |
| `main.py` → `get_available_meals` | Meal lookup | Exact MongoDB `dietType` filter | Correct — this is a lookup, not a search; no change needed |

**Hidden asset:** Your `dataset.json` has 10,000 items with an `intent` field (`"faq"` / `"recommendation"` / `"other"`). This is a ready-made training corpus for intent routing — covered in Phase 3.

---

## Phase 0 — Fix the Async Crash (Do This First)

> **This is blocking everything else. Fix before any similarity work.**

### Root cause

`/chat` is declared `async def`, but all I/O inside it is synchronous:
- `gemini_client.models.generate_content(...)` — sync Gemini SDK call, blocks the event loop
- `pymongo` — sync MongoDB driver, every `find_one` / `update_one` blocks the event loop
- `save_session_message()` and `get_session_history()` are called inline

When two users send a message at the same time, the second request waits for the first's entire Gemini round-trip (1–3 seconds) before being processed. Under load this cascades into timeouts.

### Changes

**`ai-service/requirements.txt` — add three lines:**
```
motor>=3.4.0          # async MongoDB driver (drop-in replacement for pymongo)
rank-bm25>=0.2.2      # BM25 (used in Phase 1)
numpy>=1.26.0         # needed by rank-bm25 and Phase 2 cosine scoring
```

**`ai-service/main.py` — four targeted changes:**

**Change 1: Replace pymongo with motor**
```python
# REMOVE:
from pymongo import MongoClient
mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)

# ADD:
import motor.motor_asyncio
mongo_client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
```
Motor has the exact same API as pymongo — every method is just awaitable. No other refactoring needed except adding `await` before each call.

**Change 2: Make session functions async**
```python
# BEFORE:
def get_session_history(session_id: str) -> list:
    session = db.chat_sessions.find_one({"sessionId": session_id})

# AFTER:
async def get_session_history(session_id: str) -> list:
    session = await db.chat_sessions.find_one({"sessionId": session_id})
```

```python
# BEFORE:
def save_session_message(session_id, role, content, ...):
    db.chat_sessions.update_one(...)

# AFTER:
async def save_session_message(session_id, role, content, ...):
    await db.chat_sessions.update_one(...)
```

**Change 3: Await the Gemini call**
```python
# BEFORE (the crash line):
response = gemini_client.models.generate_content(
    model=MODEL_ID, contents=gemini_history, config=config,
)

# AFTER:
response = await gemini_client.aio.models.generate_content(
    model=MODEL_ID, contents=gemini_history, config=config,
)
```
`client.aio` is the async sub-client baked into the google-genai SDK — no version upgrade needed.

**Change 4: Await the session calls inside `/chat`**
```python
# In the /chat endpoint, add await:
history = await get_session_history(sid)
await save_session_message(sid, "user", req.message)
await save_session_message(sid, "model", answer)
```

**Also: run with multiple workers**

In your start command (Procfile, Render config, or `package.json`):
```bash
# BEFORE:
uvicorn main:app --host 0.0.0.0 --port 8000

# AFTER:
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```
Async code handles concurrency within one process; multiple workers handle true parallelism across CPU cores.

**Why this is Phase 0:** All subsequent phases still benefit from this fix. Shipping BM25 search on a service that still crashes under load helps nothing.

---

## Phase 1 — Replace SequenceMatcher with BM25 for FAQ

### Why BM25 is the right method here

Your current pipeline has two problems that BM25 directly solves:

| Problem | Current behaviour | BM25 behaviour |
|---|---|---|
| Common words over-rewarded | "هل" (does) in query → `+3` every time it appears in any FAQ | "هل" is in every FAQ → near-zero IDF weight, contributes almost nothing |
| Rare important words under-rewarded | "كيتو" (keto) → same `+3` as "هل" | "كيتو" appears in few FAQs → high IDF weight, single match is very strong signal |
| Identical query repeated | No saturation, keeps adding score | BM25 saturates term frequency — 10th match worth almost nothing |

The formula (BM25 Okapi) is:

```
score(q, d) = Σ IDF(t) × [ tf(t,d) × (k1+1) ] / [ tf(t,d) + k1×(1 - b + b×|d|/avgdl) ]
```

Where `k1=1.5` controls term frequency saturation and `b=0.75` controls length normalization. You don't need to implement this — `rank_bm25` does it in one line.

### Dataset insight

Your `dataset.json` has 10,000 items but only **3,500 have real answers** (those with `intent: "faq"`). The BM25 index should be built exclusively from these 3,500 — indexing the 6,500 unanswered items would pollute search results with matches that return empty answers.

### Implementation

**In `main.py`, replace the entire dataset loading + `search_faq` function:**

```python
from rank_bm25 import BM25Okapi

# ─── Dataset loading (runs once at startup) ────────────────────────────────

dataset: list = []
faq_items: list = []      # only items with real answers
bm25_ar: BM25Okapi = None # Arabic BM25 index
bm25_en: BM25Okapi = None # English BM25 index

dataset_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'dataset.json')

if os.path.exists(dataset_path):
    with open(dataset_path, 'r', encoding='utf-8') as f:
        dataset = json.load(f)

    # Only FAQ items with real answers feed the BM25 index
    faq_items = [
        item for item in dataset
        if item.get('intent') == 'faq'
        and str(item.get('answer_ar', '')).strip()
        and str(item.get('answer_ar', '')).strip() != 'nan'
    ]

    # Pre-normalize and tokenize for BM25
    for item in faq_items:
        item['tokens_ar'] = normalize_text(item.get('question_ar', ''), 'ar').split()
        item['tokens_en'] = normalize_text(item.get('question_en', ''), 'en').split()

    # Build BM25 indexes — one for each language corpus
    # BM25Okapi takes a list-of-token-lists as input
    bm25_ar = BM25Okapi([item['tokens_ar'] for item in faq_items])
    bm25_en = BM25Okapi([item['tokens_en'] for item in faq_items])

    print(f"✅ FAQ dataset loaded: {len(faq_items)} answerable items indexed")
    print(f"✅ BM25 indexes built (AR + EN)")
```

```python
def search_faq(query: str, language: str = "ar") -> Optional[str]:
    """
    BM25-based FAQ search.

    How it works:
    1. Normalize and tokenize the query using the same pipeline as the index.
    2. Score every FAQ item using BM25Okapi.get_scores() — O(vocab) time.
    3. Return the answer of the top-scoring item if its score clears the threshold.

    Threshold logic: BM25 scores are unnormalized (higher = better, no fixed ceiling).
    A score of 0.0 means zero term overlap with any document. We use a small positive
    threshold (0.5) to avoid returning the "least bad" match when the query has no
    meaningful overlap with any FAQ question.
    """
    if not faq_items or (bm25_ar is None and bm25_en is None):
        return None

    q = query.strip()
    if len(q) < 3:
        return None

    # Normalize and tokenize query
    q_norm = normalize_text(q, language)
    q_tokens = q_norm.split()

    if not q_tokens:
        return None

    # Score against the right index, with cross-language fallback
    if language == 'en':
        primary_scores   = bm25_en.get_scores(q_tokens)
        secondary_scores = bm25_ar.get_scores(q_tokens)
    else:
        primary_scores   = bm25_ar.get_scores(q_tokens)
        secondary_scores = bm25_en.get_scores(q_tokens)

    # Element-wise max: a question matching in either language wins
    import numpy as np
    combined_scores = np.maximum(primary_scores, secondary_scores * 0.7)

    best_idx = int(combined_scores.argmax())
    best_score = float(combined_scores[best_idx])

    # Threshold: reject if no meaningful keyword overlap
    THRESHOLD = 0.5
    if best_score < THRESHOLD:
        return None

    best_item = faq_items[best_idx]
    answer = (
        best_item.get('answer_ar') if language != 'en'
        else (best_item.get('answer') or best_item.get('answer_ar'))
    )
    val = str(answer or '').strip()
    return val if val and val != 'nan' else None
```

**What changed and why:**

- The `normalize_text()` function is **unchanged** — it handles Arabic diacritics, prefix stripping, and English stemming. BM25 benefits directly from this pre-processing.
- The BM25 index is built **once at startup**, not per-request. Query time is O(vocab_size), typically < 1ms for 3,500 items.
- `secondary_scores * 0.7` — Arabic queries can partially match English tokens and vice versa. The 0.7 weight down-ranks cross-language matches without eliminating them.
- The threshold `0.5` is tunable. During testing: if you find false positives (irrelevant answers returned), raise it toward `1.0`. If you find false negatives (real FAQ questions returning `None`), lower it toward `0.2`.

### Testing BM25

Create `ai-service/tests/test_bm25.py`:
```python
from main import search_faq, bm25_ar, faq_items

def test_arabic_faq_hit():
    result = search_faq("اشتراكي بيتجدد إمتى", "ar")
    assert result is not None
    assert len(result) > 10

def test_english_faq_hit():
    result = search_faq("when does my subscription renew", "en")
    assert result is not None

def test_no_match_returns_none():
    result = search_faq("xyzzy nonsense query", "en")
    assert result is None

def test_threshold_filters_weak_matches():
    # Extremely vague query — should not match
    result = search_faq("ممكن", "ar")   # just "can" alone
    assert result is None
```

---

## Phase 2 — Cosine Similarity for Box Ranking in the AI Layer

### Current state (important context)

The Node backend's `scoreBox()` already does weighted dot product scoring. This is actually reasonable — it factors in diet match, allergen safety, popularity, and reorder history. **Do not replace this.** It runs for the webapp's `/recommended` endpoint and works well for logged-in users with profile data.

The gap is in the **AI service layer**: the Gemini agent calls `recommend_box` with only `dietType` and `maxPrice` extracted from the conversation, ignoring everything else the user has expressed in the chat (e.g., "I have a nut allergy", "I want something light around 300 calories").

### What cosine similarity adds here

Cosine similarity between a **user preference vector** (built from the conversation) and each **box feature vector** (built from the box's attributes) produces a ranked list that weights all expressed preferences simultaneously — not just diet type.

**Similarity dimension** (the angle between vectors):
```
user_vec  = [diet_vegan, diet_keto, ..., allergen_nuts, allergen_dairy, ..., max_cal_300, max_price_400, ...]
box_vec   = [is_vegan,   is_keto,  ..., has_nuts,      has_dairy,      ..., avg_cal,     price, ...]

cosine(user_vec, box_vec) = (user_vec · box_vec) / (||user_vec|| × ||box_vec||)
```

The cosine measure is appropriate here (over Euclidean) because the **direction** of the preference matters more than the magnitude. A user who said "vegan" once and a user who said "vegan" three times have the same preference — the angle between their vectors and a vegan box's vector should be the same.

### Implementation

**Step 1: Add a `rank_boxes_by_preference` function to `main.py`**

```python
import numpy as np

# Feature encoding — must match between user vector and box vector
DIET_TYPES   = ['vegan', 'vegetarian', 'keto', 'paleo', 'standard', 'mixed']
ALLERGENS    = ['gluten', 'dairy', 'nuts', 'eggs', 'soy', 'shellfish', 'fish']
# Vector layout: [diet(6), allergen_safe(7), is_budget(1), is_light(1)] = 15 dims

def box_to_vector(box: dict) -> np.ndarray:
    """
    Encode a box returned by the recommend_box tool into a 15-dim feature vector.
    All values are 0 or 1 (binary encoding of categorical features).
    """
    vec = np.zeros(15)

    # Dimensions 0–5: diet type (one-hot)
    diet = (box.get('dietType') or '').lower()
    if diet in DIET_TYPES:
        vec[DIET_TYPES.index(diet)] = 1.0
    if diet == 'mixed':  # mixed partially matches every diet
        vec[:6] = 0.5

    # Dimensions 6–12: allergen safety (1 = free of that allergen)
    # We infer allergens from the meals list if available
    meal_allergens = set()
    for meal in (box.get('meals') or []):
        meal_allergens.update(meal.get('allergens', []))
    for i, allergen in enumerate(ALLERGENS):
        vec[6 + i] = 0.0 if allergen in meal_allergens else 1.0

    # Dimension 13: budget indicator (1 = under 300 EGP)
    price = box.get('price') or box.get('basePrice') or 999
    vec[13] = 1.0 if price <= 300 else max(0.0, 1.0 - (price - 300) / 700)

    # Dimension 14: light/low-calorie indicator (placeholder; extend if calories added to tool response)
    vec[14] = 0.5  # neutral until calories are in the API response

    return vec


def preference_to_vector(preferences: dict) -> np.ndarray:
    """
    Encode the user's expressed preferences (extracted from conversation) into
    the same 15-dim space as box_to_vector.

    `preferences` dict shape:
    {
        "dietTypes": ["vegan"],           # from conversation ("I'm vegan")
        "allergens": ["nuts", "dairy"],   # user's allergens to AVOID
        "maxPrice": 350,                  # budget
        "wantsLight": True,               # "something light / low calorie"
    }
    """
    vec = np.zeros(15)

    # Diet dimensions
    for diet in (preferences.get('dietTypes') or []):
        diet = diet.lower()
        if diet in DIET_TYPES:
            vec[DIET_TYPES.index(diet)] = 1.0

    # Allergen safety dimensions: 1 = user wants this allergen free
    for allergen in (preferences.get('allergens') or []):
        allergen = allergen.lower()
        if allergen in ALLERGENS:
            idx = ALLERGENS.index(allergen)
            vec[6 + idx] = 1.0  # strong signal: this allergen must be absent

    # Budget dimension
    max_price = preferences.get('maxPrice')
    if max_price:
        vec[13] = 1.0 if max_price <= 300 else max(0.0, 1.0 - (max_price - 300) / 700)
    else:
        vec[13] = 0.0  # no budget stated = don't penalize expensive boxes

    # Light/calorie dimension
    vec[14] = 1.0 if preferences.get('wantsLight') else 0.0

    return vec


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Standard cosine similarity. Returns 0 if either vector is all-zero."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def rank_boxes_by_preference(boxes: list, preferences: dict) -> list:
    """
    Re-rank boxes from the recommend_box tool result using cosine similarity
    against the user's expressed preferences from the conversation.

    Returns the same list, sorted by similarity score descending.
    """
    if not preferences or not boxes:
        return boxes

    user_vec = preference_to_vector(preferences)

    # If user vector is all zeros (no preferences stated), return original order
    if np.linalg.norm(user_vec) == 0:
        return boxes

    scored = []
    for box in boxes:
        box_vec = box_to_vector(box)
        sim = cosine_similarity(user_vec, box_vec)
        scored.append((box, sim))

    scored.sort(key=lambda x: x[1], reverse=True)
    return [box for box, _ in scored]
```

**Step 2: Update the `execute_tool` function to use it**

```python
# In execute_tool(), in the recommend_box branch:

elif tool_name == "recommend_box":
    # ... existing fetch logic ...
    boxes = [
        {
            "id": b.get("_id"),
            "name": b.get("name"),
            "description": b.get("description", ""),
            "dietType": b.get("dietType"),
            "price": b.get("priceForServing") or b.get("basePrice"),
            "image": b.get("image", ""),
            "meals": b.get("meals") or [],  # keep full meal objects for vector encoding
        }
        for b in data.get("boxes", [])[:12]  # fetch more, then re-rank
    ]

    # Re-rank with cosine similarity if preferences were passed in args
    preferences = args.get("preferences")  # new optional arg (see Step 3)
    if preferences:
        boxes = rank_boxes_by_preference(boxes, preferences)

    return {"boxes": boxes[:6], "count": len(boxes)}
```

**Step 3: Update the Gemini tool declaration to accept preferences**

```python
types.FunctionDeclaration(
    name="recommend_box",
    description="Find and rank pre-made boxes matching user preferences. Pass ALL preferences the user has expressed in the conversation — diet, allergens, budget, and whether they want something light.",
    parameters=types.Schema(
        type="OBJECT",
        properties={
            "dietType": types.Schema(type="STRING", description="Diet type filter"),
            "maxPrice": types.Schema(type="NUMBER", description="Maximum price in EGP"),
            # NEW: structured preferences for cosine re-ranking
            "preferences": types.Schema(
                type="OBJECT",
                description="All user preferences extracted from the conversation for similarity ranking",
                properties={
                    "dietTypes": types.Schema(type="ARRAY", items=types.Schema(type="STRING"),
                                              description="e.g. ['vegan', 'keto']"),
                    "allergens": types.Schema(type="ARRAY", items=types.Schema(type="STRING"),
                                              description="Allergens the user wants to AVOID e.g. ['nuts', 'dairy']"),
                    "maxPrice":   types.Schema(type="NUMBER"),
                    "wantsLight": types.Schema(type="BOOLEAN",
                                              description="True if user mentioned low-calorie or light meals"),
                }
            ),
        },
    )
),
```

**Why cosine over dot product here:**

Dot product would favour boxes that score high on every dimension even if the user only stated one preference. A pure vegan user asking for vegan boxes wants the best-matching vegan box — not a box that is slightly vegan, slightly keto, slightly low-calorie all at once. Cosine normalizes for vector magnitude, so the angle (direction of preferences) matters more than breadth of features.

---

## Phase 3 — Intent Router Using the Dataset Labels

### What this unlocks

Your `dataset.json` already has 10,000 labeled examples split into `faq`, `recommendation`, and `other`. This is enough to build a lightweight intent classifier that runs **before** the Gemini call.

**Current flow:**
```
user message → Gemini (cold start, reads message, decides to call search_faq or recommend_box) → tool → Gemini again → answer
```

**With intent routing:**
```
user message → intent classifier (< 1ms, local) → if faq: BM25 search directly
                                                  → if recommendation: recommend_box directly
                                                  → if other: Gemini for free-form conversation
```

For FAQ and recommendation intents, this skips **the first Gemini call entirely**, cutting latency roughly in half and saving ~50% of your Gemini API calls.

### Implementation

**Add intent index at startup (alongside BM25):**

```python
# Separate BM25 indexes for intent classification
intent_faq_items  = [d for d in dataset if d.get('intent') == 'faq']
intent_rec_items  = [d for d in dataset if d.get('intent') == 'recommendation']

# Pre-normalize
for item in intent_faq_items + intent_rec_items:
    if 'tokens_ar' not in item:
        item['tokens_ar'] = normalize_text(item.get('question_ar', ''), 'ar').split()
        item['tokens_en'] = normalize_text(item.get('question_en', ''), 'en').split()

# Build intent classifiers
intent_bm25_faq_ar = BM25Okapi([i['tokens_ar'] for i in intent_faq_items])
intent_bm25_faq_en = BM25Okapi([i['tokens_en'] for i in intent_faq_items])
intent_bm25_rec_ar = BM25Okapi([i['tokens_ar'] for i in intent_rec_items])
intent_bm25_rec_en = BM25Okapi([i['tokens_en'] for i in intent_rec_items])

print("✅ Intent classifiers built")
```

**Add `classify_intent()` function:**

```python
def classify_intent(query: str, language: str = "ar") -> str:
    """
    Classify user query as 'faq', 'recommendation', or 'other'
    using BM25 max-score voting.

    Logic:
    - Score the query against the FAQ example corpus  → faq_score
    - Score the query against the recommendation corpus → rec_score
    - If neither clears a minimum threshold → 'other' (let Gemini handle it)
    - Otherwise return the intent with the higher score
    """
    q_tokens = normalize_text(query, language).split()
    if not q_tokens:
        return 'other'

    if language == 'en':
        faq_score = float(intent_bm25_faq_en.get_scores(q_tokens).max())
        rec_score = float(intent_bm25_rec_en.get_scores(q_tokens).max())
    else:
        faq_score = float(intent_bm25_faq_ar.get_scores(q_tokens).max())
        rec_score = float(intent_bm25_rec_ar.get_scores(q_tokens).max())

    INTENT_THRESHOLD = 1.0   # tune: lower = more aggressive routing, higher = more Gemini fallback
    if max(faq_score, rec_score) < INTENT_THRESHOLD:
        return 'other'

    return 'faq' if faq_score >= rec_score else 'recommendation'
```

**Wire intent routing into `/chat`:**

```python
@app.post("/chat")
async def chat(req: ChatRequest):
    sid  = req.session_id or "default"
    lang = detect_language(req.message)

    # ── Fast intent pre-classification ──────────────────────────────────────
    intent = classify_intent(req.message, lang)

    # FAQ fast path: skip Gemini entirely for clear FAQ matches
    if intent == 'faq':
        faq_answer = search_faq(req.message, lang)
        if faq_answer:
            await save_session_message(sid, "user", req.message)
            await save_session_message(sid, "model", faq_answer)
            return {"answer": faq_answer, "source": "bm25_faq", "toolCalls": []}

    # Recommendation fast path: call recommend_box, then use Gemini only to narrate results
    if intent == 'recommendation':
        # extract a best-guess dietType from the query for the initial filter
        diet_hint = _extract_diet_hint(req.message)
        rec_result = await execute_tool("recommend_box", {"dietType": diet_hint}, req.user_token, lang)
        # Still call Gemini but give it pre-fetched results — saves one tool-call round-trip
        # by injecting the results directly into the conversation context
        # (implementation detail: add rec_result to gemini_history as a system message)

    # ── Full Gemini agent path (for 'other' or when fast paths return nothing) ──
    # ... existing ReAct loop ...
```

**Helper for diet hint extraction (add near the bottom of the file):**
```python
_DIET_KEYWORDS = {
    'vegan':       ['vegan', 'نباتي', 'صيام', 'بدون لحوم'],
    'keto':        ['keto', 'كيتو', 'low carb'],
    'vegetarian':  ['vegetarian', 'نباتي كامل'],
    'paleo':       ['paleo', 'باليو'],
}

def _extract_diet_hint(text: str) -> Optional[str]:
    text_lower = text.lower()
    for diet, keywords in _DIET_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            return diet
    return None
```

---

## Phase 4 — Stretch: RAG with Sentence Embeddings

> Only pursue this after Phases 0–3 are stable. BM25 handles keyword queries well. RAG adds value specifically when users rephrase questions in ways that share no keywords with FAQ questions.

**The gap BM25 leaves:** If a user asks "هل ممكن ارجع وخد فلوسي لو مش عاجبني البوكس" (Can I get my money back if I don't like the box?) and the FAQ question is "ما هي سياسة الاسترداد؟" (What is the refund policy?), the two questions share **zero tokens** after normalization. BM25 scores 0. An embedding model maps both to nearby points in semantic space.

**What to add:**

```python
# requirements.txt
sentence-transformers>=3.0.0   # or use the Gemini Embedding API

# startup
from sentence_transformers import SentenceTransformer
embed_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
# ↑ this model handles Arabic + English in the same vector space

# Pre-compute embeddings for all FAQ questions at startup (runs once)
faq_question_texts = [item.get('question_ar', '') for item in faq_items]
faq_embeddings = embed_model.encode(faq_question_texts, normalize_embeddings=True)
# Shape: (3500, 384) — stored in RAM, ~5MB

# At query time: cosine similarity via dot product (embeddings are L2-normalized)
import numpy as np

def search_faq_semantic(query: str) -> Optional[str]:
    q_emb = embed_model.encode([query], normalize_embeddings=True)  # shape (1, 384)
    scores = faq_embeddings @ q_emb.T  # dot product = cosine when normalized
    best_idx = int(scores.argmax())
    best_score = float(scores[best_idx])
    SEMANTIC_THRESHOLD = 0.65   # cosine similarity threshold (0–1 range)
    if best_score < SEMANTIC_THRESHOLD:
        return None
    item = faq_items[best_idx]
    return item.get('answer_ar') or item.get('answer')
```

**Hybrid BM25 + Semantic (the "Hybrid Similarity" from your table):**

```python
def search_faq_hybrid(query: str, language: str = "ar") -> Optional[str]:
    """
    Reciprocal Rank Fusion of BM25 and semantic scores.
    RRF(d) = Σ 1 / (k + rank_i(d))  where k=60 is a smoothing constant.
    """
    # BM25 ranking
    q_tokens = normalize_text(query, language).split()
    bm25_scores = bm25_ar.get_scores(q_tokens) if language != 'en' else bm25_en.get_scores(q_tokens)
    bm25_ranks = np.argsort(-bm25_scores)  # descending

    # Semantic ranking
    q_emb = embed_model.encode([query], normalize_embeddings=True)
    semantic_scores = faq_embeddings @ q_emb.T
    semantic_ranks = np.argsort(-semantic_scores.flatten())

    # RRF fusion
    k = 60
    rrf_scores = np.zeros(len(faq_items))
    for rank, idx in enumerate(bm25_ranks):
        rrf_scores[idx] += 1 / (k + rank + 1)
    for rank, idx in enumerate(semantic_ranks):
        rrf_scores[idx] += 1 / (k + rank + 1)

    best_idx = int(rrf_scores.argmax())
    item = faq_items[best_idx]
    return item.get('answer_ar') if language != 'en' else (item.get('answer') or item.get('answer_ar'))
```

**Trade-off table for this phase:**

| | BM25 only | Semantic only | Hybrid (RRF) |
|---|---|---|---|
| Keyword queries | ✅ Excellent | ⚠️ OK | ✅ Excellent |
| Paraphrase queries | ❌ Fails | ✅ Excellent | ✅ Excellent |
| Cold start time | ~10ms | ~3s (model load) | ~3s (model load) |
| RAM usage | ~2MB | ~500MB | ~500MB |
| Requires GPU? | No | No (CPU fine for 3500 docs) | No |
| Recommended for Boxify now? | ✅ Yes | ⚠️ Later | ⚠️ Later |

The multilingual MiniLM model runs on CPU in ~50ms per query for a 3,500-item corpus — acceptable for a chatbot. Load it only if BM25 (Phase 1) leaves noticeable gaps in your testing.

---

## Summary: Changes Per File

### `ai-service/requirements.txt`
```
+ motor>=3.4.0
+ rank-bm25>=0.2.2
+ numpy>=1.26.0
```

### `ai-service/main.py`

| Section | Change | Phase |
|---|---|---|
| MongoDB client | `pymongo.MongoClient` → `motor.motor_asyncio.AsyncIOMotorClient` | 0 |
| `get_session_history` | Add `async def` + `await` | 0 |
| `save_session_message` | Add `async def` + `await` | 0 |
| `/chat` Gemini call | `generate_content` → `aio.models.generate_content` | 0 |
| `/chat` session calls | Add `await` before both | 0 |
| Dataset loading block | Filter to `intent == 'faq'` with answers, build `bm25_ar` + `bm25_en` | 1 |
| `search_faq()` | Replace SequenceMatcher loop with `bm25.get_scores()` | 1 |
| New: `box_to_vector()` | Encode box attributes into 15-dim float vector | 2 |
| New: `preference_to_vector()` | Encode user prefs into same 15-dim space | 2 |
| New: `cosine_similarity()` | Standard cosine, handles zero-vector | 2 |
| New: `rank_boxes_by_preference()` | Re-rank boxes using cosine scores | 2 |
| `execute_tool` recommend_box | Call `rank_boxes_by_preference` before returning | 2 |
| `TOOL_DECLARATIONS` recommend_box | Add `preferences` object param | 2 |
| New: `classify_intent()` + intent BM25 indexes | Route FAQ/recommendation/other before Gemini | 3 |
| `/chat` | Add intent routing block at the top | 3 |

### `backend/controllers/boxController.js`
No changes needed. The existing `scoreBox()` is already a well-designed weighted dot product — it runs for the web UI's recommendation endpoint and complements (not conflicts with) the cosine ranking layer added in the AI service.

---

## Deployment Checklist

```
□ Phase 0: pip install motor  — test that /chat returns 200 under 10 concurrent requests
□ Phase 0: uvicorn --workers 4 — verify worker count in Render/Heroku dashboard
□ Phase 1: pip install rank-bm25 numpy — test search_faq("متى يتجدد اشتراكي") returns answer
□ Phase 1: run pytest ai-service/tests/test_bm25.py — all 4 tests pass
□ Phase 2: test recommend_box with preferences={"dietTypes":["vegan"],"allergens":["nuts"]}
□ Phase 2: confirm vegan + nut-free boxes rank above non-matching boxes in response
□ Phase 3: test classify_intent("سياسة الاسترداد") == 'faq'
□ Phase 3: test classify_intent("ارشحلي بوكس كيتو") == 'recommendation'
□ Phase 3: confirm FAQ fast-path responses arrive faster (no Gemini call in response source)
```
