"""
Boxify AI Service — Gemini 2.0 Flash Function-Calling Agent
============================================================
A conversational AI assistant that can:
  1. Answer FAQ questions about Boxify
  2. Recommend boxes based on user preferences
  3. Build custom boxes through interactive conversation
  4. Add items to the user's cart
  5. Create subscriptions

Uses Google Gemini 2.0 Flash with native function calling (no LangChain).
"""

from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from groq import AsyncGroq
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager
import os, json, httpx, time, sys, re, difflib, asyncio, random
import numpy as np
from rank_bm25 import BM25Okapi

# Reconfigure stdout/stderr to UTF-8 to prevent UnicodeEncodeError on Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# MONGODB (for sessions + FAQ data)
# ─────────────────────────────────────────────────────────────────────────────

MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")

db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db
    try:
        mongo_client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        await mongo_client.admin.command('ping')
        db = mongo_client["boxify"]
        # Create TTL index on chat_sessions — auto-delete after 7 days
        await db.chat_sessions.create_index("expiresAt", expireAfterSeconds=0)
        print("✅ Connected to MongoDB")
    except Exception as e:
        print(f"❌ MongoDB error: {e}")
        db = None
    yield

# ─────────────────────────────────────────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(title="Boxify AI Service", version="2.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# GROQ CLIENT
# ─────────────────────────────────────────────────────────────────────────────

groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
MODEL_ID = "llama-3.3-70b-versatile"

# ─────────────────────────────────────────────────────────────────────────────
# FAQ DATASET
# ─────────────────────────────────────────────────────────────────────────────

dataset: list = []
faq_items: list = []      # only FAQ items with real answers
bm25_ar = None            # Arabic FAQ BM25 Okapi
bm25_en = None            # English FAQ BM25 Okapi

# Intent classification BM25 indices
intent_faq_items: list = []
intent_rec_items: list = []
intent_bm25_faq_ar = None
intent_bm25_faq_en = None
intent_bm25_rec_ar = None
intent_bm25_rec_en = None

dataset_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'dataset.json')

_last_indexed_dataset_id = None

def _ensure_indices_built():
    global _last_indexed_dataset_id, faq_items, bm25_ar, bm25_en
    global intent_faq_items, intent_rec_items
    global intent_bm25_faq_ar, intent_bm25_faq_en, intent_bm25_rec_ar, intent_bm25_rec_en

    if _last_indexed_dataset_id != id(dataset):
        # Pre-normalize and tokenize dataset questions if not already done
        for item in dataset:
            if 'tokens_ar' not in item:
                item['tokens_ar'] = normalize_text(item.get('question_ar') or '', 'ar').split()
            if 'tokens_en' not in item:
                item['tokens_en'] = normalize_text(item.get('question_en') or '', 'en').split()
            item['question_en_norm'] = " ".join(item['tokens_en'])
            item['question_ar_norm'] = " ".join(item['tokens_ar'])

        # Determine if we have any items with intent == 'faq' in the dataset
        has_faq_intent = any(item.get('intent') == 'faq' for item in dataset)

        # Filter answerable FAQ items (non-empty answers)
        faq_items = [
            item for item in dataset
            if (not has_faq_intent or item.get('intent') == 'faq')
            and str(item.get('answer_ar') or item.get('answer') or '').strip()
            and str(item.get('answer_ar') or item.get('answer') or '').strip().lower() != 'nan'
        ]
        
        # Build FAQ BM25 indices
        if faq_items:
            bm25_ar = BM25Okapi([item['tokens_ar'] for item in faq_items])
            bm25_en = BM25Okapi([item['tokens_en'] for item in faq_items])
            # Floor negative IDFs to a small positive value
            for bm in [bm25_ar, bm25_en]:
                if bm and hasattr(bm, 'idf'):
                    for word, idf in list(bm.idf.items()):
                        if idf < 0:
                            bm.idf[word] = 0.01
        else:
            bm25_ar = None
            bm25_en = None

        # Build intent classifiers
        intent_faq_items = [item for item in dataset if item.get('intent') == 'faq']
        intent_rec_items = [item for item in dataset if item.get('intent') == 'recommendation']
        
        if intent_faq_items:
            intent_bm25_faq_ar = BM25Okapi([item['tokens_ar'] for item in intent_faq_items])
            intent_bm25_faq_en = BM25Okapi([item['tokens_en'] for item in intent_faq_items])
            for bm in [intent_bm25_faq_ar, intent_bm25_faq_en]:
                if bm and hasattr(bm, 'idf'):
                    for word, idf in list(bm.idf.items()):
                        if idf < 0:
                            bm.idf[word] = 0.01
        else:
            intent_bm25_faq_ar = None
            intent_bm25_faq_en = None
            
        if intent_rec_items:
            intent_bm25_rec_ar = BM25Okapi([item['tokens_ar'] for item in intent_rec_items])
            intent_bm25_rec_en = BM25Okapi([item['tokens_en'] for item in intent_rec_items])
            for bm in [intent_bm25_rec_ar, intent_bm25_rec_en]:
                if bm and hasattr(bm, 'idf'):
                    for word, idf in list(bm.idf.items()):
                        if idf < 0:
                            bm.idf[word] = 0.01
        else:
            intent_bm25_rec_ar = None
            intent_bm25_rec_en = None
            
        _last_indexed_dataset_id = id(dataset)

# Define stop words for English and Arabic to filter out of FAQ searches to prevent false positives
STOP_WORDS = {
    # English stop words
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves",
    "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their",
    "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are",
    "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an",
    "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about",
    "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up",
    "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when",
    "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no",
    "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don",
    "should", "now", "want", "wanted", "confirm", "please", "would", "could", "like", "tell",
    # Arabic stop words / dialect common words
    "من", "الى", "في", "على", "عن", "مع", "هذا", "هذه", "التي", "الذي", "ان", "انها", "انه", "هل", "ما", "ماذا",
    "كيف", "لماذا", "كم", "اين", "متى", "هو", "هي", "هم", "انا", "نحن", "انت", "انتم", "يا", "او", "ام", "بل",
    "لا", "نعم", "غير", "كل", "بعض", "تم", "كان", "كانت", "يكون", "حتى", "لقد", "قد", "عبر", "بين", "تحت",
    "فوق", "امام", "خلف", "داخل", "خارج", "عايز", "اريد", "طلب", "لو", "يافندم", "ممكن", "طريقة", "حاجة", "عندي"
}

def normalize_text(text: str, language: str = "ar") -> str:
    if not text:
        return ""
    text = text.lower().strip()
    
    if language != "en":
        # Strip Arabic diacritics (harakat)
        text = re.sub(r"[\u064B-\u065F]", "", text)
        # Unify letters
        text = re.sub(r"[إأآ]", "ا", text)
        text = re.sub(r"ة", "ه", text)
        text = re.sub(r"ى", "ي", text)
        text = re.sub(r"[ؤئ]", "ء", text)
        # Remove punctuation
        text = re.sub(r"[؟!\.,;\-\?\/_]", " ", text)
        # Strip prefixes
        words = []
        for w in text.split():
            if w.startswith("ال") and len(w) > 4:
                w = w[2:]
            elif w.startswith("لل") and len(w) > 4:
                w = w[2:]
            elif w.startswith("بال") and len(w) > 5:
                w = w[3:]
            elif (w.startswith("ب") or w.startswith("ل") or w.startswith("ف") or w.startswith("و")) and len(w) > 4:
                w = w[1:]
            words.append(w)
        return " ".join(words)
    else:
        # English normalization
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        words = []
        for w in text.split():
            if len(w) > 4:
                if w.endswith("ies"):
                    w = w[:-3] + "y"
                elif w.endswith("ing"):
                    w = w[:-3]
                elif w.endswith("ed"):
                    w = w[:-2]
                elif w.endswith("s") and not w.endswith("ss"):
                    w = w[:-1]
            words.append(w)
        return " ".join(words)

if os.path.exists(dataset_path):
    with open(dataset_path, 'r', encoding='utf-8') as f:
        dataset = json.load(f)
    print(f"✅ FAQ dataset loaded: {len(dataset)} items")
    _ensure_indices_built()
    print("✅ FAQ and intent indices built")
else:
    print("⚠️ dataset.json not found")


def search_faq(query: str, language: str = "ar") -> Optional[str]:
    """BM25-based FAQ search with cross-language fallback and typo-resilient SequenceMatcher fallback."""
    _ensure_indices_built()
    
    q = query.strip()
    if len(q) < 4:
        return None

    if not faq_items or (bm25_ar is None and bm25_en is None):
        return None

    q_norm = normalize_text(q, language)
    q_tokens = [w for w in q_norm.split() if w not in STOP_WORDS]

    best_item = None
    best_score = 0.0

    if q_tokens:
        # Score query against Arabic/English BM25 indices
        if language == 'en':
            primary_scores   = bm25_en.get_scores(q_tokens)
            secondary_scores = bm25_ar.get_scores(q_tokens)
        else:
            primary_scores   = bm25_ar.get_scores(q_tokens)
            secondary_scores = bm25_en.get_scores(q_tokens)

        # Element-wise max to allow cross-language matching with a penalty on secondary language
        combined_scores = np.maximum(primary_scores, secondary_scores * 0.7)

        best_idx = int(combined_scores.argmax())
        best_score = float(combined_scores[best_idx])

    # Tunable threshold for relevance
    THRESHOLD = 0.5 if len(dataset) > 10 else 0.01
    if best_score >= THRESHOLD:
        best_item = faq_items[best_idx]
    else:
        # ── Typo-Resilient SequenceMatcher Fallback ──────────────────────────
        # If BM25 didn't clear the threshold, run the fuzzy SequenceMatcher matching
        # on the top candidates to support typos/stemming gaps
        q_words = set(q_norm.split())
        candidates = []
        for item in faq_items:
            target_norm = item.get('question_ar_norm') if language != 'en' else item.get('question_en_norm')
            other_norm = item.get('question_en_norm') if language != 'en' else item.get('question_ar_norm')
            
            score = 0
            for qw in q_words:
                if len(qw) >= 2:
                    if qw in target_norm:
                        score += 3
                    elif qw in other_norm:
                        score += 1.5
                        
            len_diff = abs(len(q_norm) - len(target_norm))
            candidates.append((item, score, target_norm, other_norm, len_diff))
            
        candidates.sort(key=lambda x: (-x[1], x[4]))
        top_candidates = candidates[:50]
        
        fuzzy_best_match = None
        fuzzy_best_score = 0.0
        fuzzy_threshold = 10.0
        
        for item, fast_score, target_norm, other_norm, len_diff in top_candidates:
            seq_ratio = difflib.SequenceMatcher(None, q_norm, target_norm).ratio()
            seq_ratio_other = difflib.SequenceMatcher(None, q_norm, other_norm).ratio()
            best_ratio = max(seq_ratio, seq_ratio_other)
            
            total_score = best_ratio * 12 + fast_score
            
            # Substring containment bonus
            if q_norm in target_norm or target_norm in q_norm:
                total_score += 6
            elif q_norm in other_norm or other_norm in q_norm:
                total_score += 3
                
            sorted_q = " ".join(sorted(q_norm.split()))
            sorted_target = " ".join(sorted(target_norm.split()))
            sorted_ratio = difflib.SequenceMatcher(None, sorted_q, sorted_target).ratio()
            total_score += sorted_ratio * 4
            
            if total_score > fuzzy_best_score:
                fuzzy_best_score = total_score
                fuzzy_best_match = item

        if fuzzy_best_score >= fuzzy_threshold:
            best_item = fuzzy_best_match

    if best_item is not None:
        answer = (
            best_item.get('answer_ar') if language != 'en'
            else (best_item.get('answer') or best_item.get('answer_ar'))
        )
        val = str(answer or '').strip()
        return val if val and val != 'nan' else None

    return None


def _bm25_intent_scores(query: str, language: str = "ar") -> tuple[float, float]:
    _ensure_indices_built()
    if not intent_faq_items or not intent_rec_items or intent_bm25_faq_ar is None:
        return 0.0, 0.0
        
    q_norm = normalize_text(query, language)
    q_tokens = [w for w in q_norm.split() if w not in STOP_WORDS]
    if not q_tokens:
        return 0.0, 0.0

    if language == 'en':
        faq_score = float(intent_bm25_faq_en.get_scores(q_tokens).max())
        rec_score = float(intent_bm25_rec_en.get_scores(q_tokens).max())
    else:
        faq_score = float(intent_bm25_faq_ar.get_scores(q_tokens).max())
        rec_score = float(intent_bm25_rec_ar.get_scores(q_tokens).max())
    return faq_score, rec_score


CUSTOM_BOX_KEYWORDS = [
    "custom box", "build my own", "build my box", "choose my meals", "pick meals",
    "make my own box", "create a custom", "my own box", "meal ids", "meal_id",
    "build a box", "customize my box", "بوكس مخصص", "ابني بوكس", "اختار وجبات",
    "اختار اكل", "وجباتي", "علبة مخصصة",
]
RECOMMENDATION_KEYWORDS = [
    "recommend", "suggest", "best box", "good box", "box for", "pre-made",
    "premade", "ready box", "which box", "اقتراح", "رشح", "ترشح", "انصح", "بوكس مناسب",
]
FAQ_KEYWORDS = [
    "policy", "refund", "cancel", "cancellation", "delivery", "shipping", "payment",
    "price", "pricing", "subscription", "account", "order", "minimum order",
    "سياسة", "استرداد", "الغاء", "إلغاء", "توصيل", "دفع", "سعر", "اشتراك", "طلب",
]
DIALOGUE_KEYWORDS = [
    "hi", "hello", "hey", "thanks", "thank you", "joke", "how are you",
    "مرحبا", "اهلا", "أهلا", "شكرا", "عامل ايه",
]


def _has_any(text: str, keywords: list[str]) -> bool:
    return any(keyword in text for keyword in keywords)


def _has_custom_box_context(history: list | None) -> bool:
    if not history:
        return False
    recent = " ".join(str(msg.get("content", "")) for msg in history[-8:]).lower()
    return _has_any(recent, CUSTOM_BOX_KEYWORDS) or any(
        (msg.get("toolCall") or {}).get("name") in {"get_available_meals", "create_custom_box"}
        for msg in history[-8:]
    )


def determine_next_mode(query: str, language: str = "ar", current_mode: str | None = None) -> tuple[str, float, str]:
    """Determine the next chatbot mode based on query, language, and the active session mode."""
    q = (query or "").strip()
    if not q:
        return "dialogue", 0.0, "empty_message"

    text = q.lower()
    faq_score, rec_score = _bm25_intent_scores(q, language)
    threshold = 1.0 if len(dataset) > 10 else 0.01

    custom_hit = _has_any(text, CUSTOM_BOX_KEYWORDS) or bool(re.search(r"\bmeal[_-]?[a-z0-9]+\b", text))
    rec_hit = _has_any(text, RECOMMENDATION_KEYWORDS)
    faq_hit = _has_any(text, FAQ_KEYWORDS)
    dialogue_hit = _has_any(text, DIALOGUE_KEYWORDS)

    detected_mode = None
    confidence = 0.0
    reason = ""

    if custom_hit:
        detected_mode = "custom_box"
        confidence = 0.92
        reason = "custom_box_keywords"
    elif rec_hit and (rec_score >= faq_score or not faq_hit):
        score_val = rec_score / (rec_score + 1) if rec_score > 0 else 0.0
        detected_mode = "recommendation"
        confidence = max(0.78, min(0.98, score_val))
        reason = "recommendation_keywords"
    elif faq_hit and (faq_score >= rec_score or not rec_hit):
        score_val = faq_score / (faq_score + 1) if faq_score > 0 else 0.0
        detected_mode = "faq"
        confidence = max(0.75, min(0.98, score_val))
        reason = "faq_keywords"
    elif max(faq_score, rec_score) >= threshold:
        if faq_score >= rec_score:
            detected_mode = "faq"
            confidence = min(0.95, faq_score / (faq_score + 1))
            reason = "bm25_faq"
        else:
            detected_mode = "recommendation"
            confidence = min(0.95, rec_score / (rec_score + 1))
            reason = "bm25_recommendation"
    elif dialogue_hit or len(text.split()) <= 3:
        detected_mode = "dialogue"
        confidence = 0.55
        reason = "dialogue_or_short_message"
    else:
        detected_mode = "dialogue"
        confidence = 0.45
        reason = "fallback_dialogue"

    # State transition:
    # Allow strong new intents to interrupt, but keep weak/ambiguous dialogue within current active mode.
    if current_mode in ("custom_box", "recommendation"):
        is_strong_new_intent = (
            (detected_mode == "faq" and (faq_hit or faq_score >= 8.0)) or
            (detected_mode == "recommendation" and (rec_hit or rec_score >= 8.0)) or
            (detected_mode == "custom_box" and (custom_hit or bool(re.search(r"\bmeal[_-]?[a-z0-9]+\b", text))))
        )
        if not is_strong_new_intent:
            return current_mode, 0.85, f"continue_{current_mode}_session"

    return detected_mode, confidence, reason


def classify_chat_mode(query: str, language: str = "ar", history: list | None = None) -> dict:
    """Return a structured routing decision for faq, recommendation, custom_box, or dialogue."""
    current_mode = None
    if history:
        if _has_custom_box_context(history):
            current_mode = "custom_box"
    mode, confidence, reason = determine_next_mode(query, language, current_mode)
    return {"mode": mode, "confidence": round(float(confidence), 3), "reason": reason}


def classify_intent(query: str, language: str = "ar") -> str:
    """Classify user query as 'faq', 'recommendation', or 'other' using BM25 max-score voting."""
    mode, confidence, reason = determine_next_mode(query, language)
    return mode if mode in ("faq", "recommendation") else "other"


# ─────────────────────────────────────────────────────────────────────────────
# COSINE SIMILARITY FOR BOX RANKING (Phase 2)
# ─────────────────────────────────────────────────────────────────────────────

DIET_TYPES   = ['vegan', 'vegetarian', 'keto', 'paleo', 'standard', 'mixed']
ALLERGENS    = ['gluten', 'dairy', 'nuts', 'eggs', 'soy', 'shellfish', 'fish']
# Vector layout: [diet(6), allergen_safe(7), is_budget(1), wants_light(1)] = 15 dims

def box_to_vector(box: dict) -> np.ndarray:
    """
    Encode a box returned by the recommend_box tool into a 15-dim feature vector.
    All values are 0 or 1 (binary encoding of categorical features).
    """
    vec = np.zeros(15)

    # Dimensions 0–5: diet type (one-hot)
    diet = (box.get('dietType') or '').lower().strip()
    if diet in DIET_TYPES:
        vec[DIET_TYPES.index(diet)] = 1.0
    elif diet == 'mixed':  # mixed partially matches every diet
        vec[:6] = 0.5

    # Dimensions 6–12: allergen safety (1.0 = free of that allergen)
    meal_allergens = set()
    for meal in (box.get('meals') or []):
        if isinstance(meal, dict):
            meal_allergens.update(meal.get('allergens', []))
        elif isinstance(meal, str):
            # Fallback if meals are passed as string names
            pass
            
    for i, allergen in enumerate(ALLERGENS):
        vec[6 + i] = 0.0 if allergen in meal_allergens else 1.0

    # Dimension 13: budget indicator (1.0 = under 300 EGP, decayed otherwise)
    price = box.get('price') or box.get('basePrice') or 999
    try:
        price = float(price)
    except (ValueError, TypeError):
        price = 999.0
    vec[13] = 1.0 if price <= 300 else max(0.0, 1.0 - (price - 300) / 700)

    # Dimension 14: light/low-calorie indicator
    vec[14] = 0.5  # neutral until calories are in the API response

    return vec


def preference_to_vector(preferences: dict) -> np.ndarray:
    """
    Encode the user's expressed preferences (extracted from conversation) into
    the same 15-dim space as box_to_vector.
    """
    vec = np.zeros(15)

    # Diet dimensions
    for diet in (preferences.get('dietTypes') or []):
        diet = diet.lower().strip()
        if diet in DIET_TYPES:
            vec[DIET_TYPES.index(diet)] = 1.0

    # Allergen safety dimensions: 1.0 = user wants this allergen free (i.e. to avoid it)
    for allergen in (preferences.get('allergens') or []):
        allergen = allergen.lower().strip()
        if allergen in ALLERGENS:
            idx = ALLERGENS.index(allergen)
            vec[6 + idx] = 1.0  # user needs this allergen absent

    # Budget dimension
    max_price = preferences.get('maxPrice')
    if max_price:
        try:
            max_price = float(max_price)
            vec[13] = 1.0 if max_price <= 300 else max(0.0, 1.0 - (max_price - 300) / 700)
        except (ValueError, TypeError):
            vec[13] = 0.0
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

# ─────────────────────────────────────────────────────────────────────────────
# TOOL DEFINITIONS (Gemini Function Declarations)
# ─────────────────────────────────────────────────────────────────────────────

TOOL_DECLARATIONS = [
    {
        "type": "function",
        "function": {
            "name": "lookup_store_policy",
            "description": "Retrieve policy documentation for customer inquiries about shipping, pricing, cancellations, and accounts.",
            "parameters": {
                "type": "object",
                "properties": {
                    "question": {
                        "type": "string",
                        "description": "The user's question about Boxify"
                    }
                },
                "required": ["question"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "recommend_box",
            "description": "Find pre-made boxes matching user preferences. Returns box cards with name, price, diet type, and image. Use when user wants a box recommendation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "dietType": {
                        "type": "string",
                        "description": "Diet type filter: vegan, vegetarian, keto, paleo, standard"
                    },
                    "maxPrice": {
                        "type": "number",
                        "description": "Maximum price in EGP"
                    },
                    "preferences": {
                        "type": "object",
                        "description": "All user preferences extracted from the conversation for similarity ranking",
                        "properties": {
                            "dietTypes": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "e.g. ['vegan', 'keto']"
                            },
                            "allergens": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Allergens the user wants to AVOID e.g. ['nuts', 'dairy']"
                            },
                            "maxPrice": {
                                "type": "number"
                            },
                            "wantsLight": {
                                "type": "boolean",
                                "description": "True if user mentioned low-calorie or light meals"
                            }
                        }
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_available_meals",
            "description": "List meals available for building a custom box. Use when user wants to build their own box or see available meals.",
            "parameters": {
                "type": "object",
                "properties": {
                    "dietType": {
                        "type": "string",
                        "description": "Filter by diet type: vegan, vegetarian, keto, paleo, standard"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_custom_box",
            "description": "Create a custom box from selected meal IDs. Call ONLY after the user has reviewed and confirmed their meal selection, serving size, and whether they want one-time or subscription.",
            "parameters": {
                "type": "object",
                "properties": {
                    "mealIds": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Array of meal ID strings"
                    },
                    "name": {
                        "type": "string",
                        "description": "Optional custom name for the box"
                    }
                },
                "required": ["mealIds"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_to_cart",
            "description": "Add a box to the user's shopping cart. Use after recommending a box or creating a custom box, when the user confirms they want it.",
            "parameters": {
                "type": "object",
                "properties": {
                    "boxId": {
                        "type": "string",
                        "description": "The box ID to add"
                    },
                    "servingSize": {
                        "type": "number",
                        "description": "Serving size: 1, 2, 4, or 6"
                    },
                    "quantity": {
                        "type": "number",
                        "description": "Number of boxes to add, default 1"
                    }
                },
                "required": ["boxId", "servingSize"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_subscription",
            "description": "Create a recurring subscription for a box. Use when user explicitly wants a subscription (weekly or monthly delivery).",
            "parameters": {
                "type": "object",
                "properties": {
                    "boxId": {
                        "type": "string",
                        "description": "The box ID to subscribe to"
                    },
                    "servingSize": {
                        "type": "number",
                        "description": "Serving size: 1, 2, 4, or 6"
                    },
                    "frequency": {
                        "type": "string",
                        "description": "Delivery frequency: weekly or monthly"
                    }
                },
                "required": ["boxId", "servingSize", "frequency"]
            }
        }
    }
]

# ─────────────────────────────────────────────────────────────────────────────
# TOOL EXECUTION
# ─────────────────────────────────────────────────────────────────────────────

async def execute_tool(tool_name: str, args: dict, user_token: str = None, language: str = "ar") -> dict:
    """Execute a tool call by either searching locally or calling the Node.js API."""

    if tool_name == "lookup_store_policy":
        result = search_faq(args.get("question", ""), language)
        if result:
            return {"found": True, "answer": result}
        return {"found": False, "message": "No FAQ answer found for this question."}

    # All other tools require calling the Node.js backend
    headers = {}
    if user_token:
        headers["Authorization"] = f"Bearer {user_token}"
    headers["Content-Type"] = "application/json"

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
     
            if tool_name == "recommend_box":
                params = {}
                if args.get("dietType"):
                    params["dietType"] = args["dietType"].lower().strip()
                if args.get("maxPrice"):
                    params["maxPrice"] = str(args["maxPrice"])
                resp = await client.get(f"{BACKEND_URL}/api/boxes/recommended", headers=headers, params=params)
                data = resp.json()
                raw_boxes = data.get("boxes", [])
                
                # Retrieve up to 12 boxes for similarity ranking
                boxes_to_rank = [
                    {
                        "id": b.get("_id"),
                        "name": b.get("name"),
                        "description": b.get("description", ""),
                        "dietType": b.get("dietType"),
                        "price": b.get("priceForServing") or b.get("basePrice"),
                        "image": b.get("image", ""),
                        "meals": b.get("meals") or [],  # Keep full meal objects for vectorization
                    }
                    for b in raw_boxes[:12]
                ]
                
                # Re-rank utilizing cosine similarity if preferences are provided
                preferences = args.get("preferences")
                if preferences:
                    boxes_to_rank = rank_boxes_by_preference(boxes_to_rank, preferences)
                
                # Simplify the response for Gemini
                final_boxes = []
                for b in boxes_to_rank[:6]:
                    meals_simplified = []
                    for m in b.get("meals", []):
                        if isinstance(m, dict):
                            meals_simplified.append(m.get("name"))
                        elif isinstance(m, str):
                            meals_simplified.append(m)
                    final_boxes.append({
                        "id": b.get("id"),
                        "name": b.get("name"),
                        "description": b.get("description", ""),
                        "dietType": b.get("dietType"),
                        "price": b.get("price"),
                        "image": b.get("image", ""),
                        "meals": meals_simplified,
                    })
                
                return {
                    "boxes": final_boxes,
                    "count": len(raw_boxes),
                }

            elif tool_name == "get_available_meals":
                # Fetch meals directly from MongoDB for speed
                if db is not None:
                    query_filter = {}
                    if args.get("dietType"):
                        query_filter["dietType"] = args["dietType"].lower().strip()
                    if args.get("mealIds"):
                        from bson import ObjectId
                        match_ids = []
                        for m_id in args["mealIds"]:
                            match_ids.append(m_id)
                            clean_id = m_id.replace("meal-", "").replace("meal_", "").replace("meal", "")
                            if len(clean_id) == 24:
                                try:
                                    match_ids.append(ObjectId(clean_id))
                                except Exception:
                                    pass
                        query_filter["_id"] = {"$in": match_ids}
                    limit_val = 200 if args.get("mealIds") else 20
                    meals = await db.meals.find(query_filter, {
                        "_id": 1, "name": 1, "description": 1, "dietType": 1,
                        "pricePerServing": 1, "caloriesPerServing": 1, "allergens": 1
                    }).to_list(length=limit_val)
                    return {
                        "meals": [
                            {
                                "id": str(m["_id"]),
                                "name": m.get("name"),
                                "description": "",
                                "dietType": m.get("dietType"),
                                "price": m.get("pricePerServing"),
                                "calories": m.get("caloriesPerServing"),
                                "allergens": m.get("allergens", []),
                            }
                            for m in meals
                        ],
                        "count": len(meals),
                    }
                return {"meals": [], "error": "Database unavailable"}

            elif tool_name == "create_custom_box":
                if not user_token:
                    return {"error": "User must be logged in to create a box"}
                payload = {"meals": args["mealIds"], "servingSize": int(args.get("servingSize", 2))}
                if args.get("name"):
                    payload["name"] = args["name"]
                resp = await client.post(f"{BACKEND_URL}/api/boxes/custom", headers=headers, json=payload)
                data = resp.json()
                if resp.status_code >= 400:
                    return {"error": data.get("message", "Failed to create box")}
                box = data.get("box", {})
                return {
                    "success": True,
                    "boxId": str(box.get("_id", "")),
                    "name": box.get("name", ""),
                    "price": data.get("priceForServing") or box.get("basePrice", 0),
                }

            elif tool_name == "add_to_cart":
                if not user_token:
                    return {"error": "User must be logged in to add to cart"}
                payload = {
                    "boxId": args["boxId"],
                    "servingSize": int(args["servingSize"]),
                    "quantity": int(args.get("quantity", 1)),
                }
                resp = await client.post(f"{BACKEND_URL}/api/cart/items", headers=headers, json=payload)
                data = resp.json()
                if resp.status_code >= 400:
                    return {"error": data.get("message", "Failed to add to cart")}
                return {
                    "success": True,
                    "message": data.get("message", "Added to cart"),
                    "cartTotal": data.get("cart", {}).get("cartTotal", 0),
                }

            elif tool_name == "create_subscription":
                if not user_token:
                    return {"error": "User must be logged in to create a subscription"}
                payload = {
                    "boxId": args["boxId"],
                    "servingSize": int(args["servingSize"]),
                    "frequency": args["frequency"],
                }
                if args.get("deliveryDay"):
                    payload["deliveryDay"] = args["deliveryDay"]
                if args.get("deliveryAddress"):
                    payload["deliveryAddress"] = args["deliveryAddress"]
                if args.get("phone"):
                    payload["phone"] = args["phone"]
                resp = await client.post(f"{BACKEND_URL}/api/subscriptions", headers=headers, json=payload)
                data = resp.json()
                if resp.status_code >= 400:
                    return {"error": data.get("message", "Failed to create subscription")}
                return {
                    "success": True,
                    "message": data.get("message", "Subscription created"),
                    "subscriptionId": str(data.get("subscription", {}).get("_id", "")),
                }

            else:
                return {"error": f"Unknown tool: {tool_name}"}

        except httpx.TimeoutException:
            return {"error": "Backend request timed out"}
        except Exception as e:
            return {"error": f"Tool execution failed: {str(e)}"}

# ─────────────────────────────────────────────────────────────────────────────
# SESSION MANAGEMENT (MongoDB-backed)
# ─────────────────────────────────────────────────────────────────────────────

async def get_session_history(session_id: str) -> list:
    """Retrieve conversation history from MongoDB."""
    if db is None:
        return []
    session = await db.chat_sessions.find_one({"sessionId": session_id})
    if not session:
        return []
    return session.get("messages", [])


async def get_session_mode(session_id: str) -> Optional[str]:
    """Retrieve the current active mode for the session from MongoDB."""
    if db is None:
        return None
    session = await db.chat_sessions.find_one({"sessionId": session_id})
    if not session:
        return None
    return session.get("currentMode")


async def save_session_mode(session_id: str, mode: str):
    """Save the active mode for the session in MongoDB."""
    if db is None:
        return
    now = datetime.now(timezone.utc)
    await db.chat_sessions.update_one(
        {"sessionId": session_id},
        {
            "$set": {
                "currentMode": mode,
                "updatedAt": now,
            },
            "$setOnInsert": {
                "createdAt": now,
            }
        },
        upsert=True
    )


async def save_session_message(session_id: str, role: str, content: str, user_id: str = None,
                         tool_call: dict = None, tool_result: dict = None):
    """Append a message to the session in MongoDB."""
    if db is None:
        return

    now = datetime.now(timezone.utc)
    message = {
        "role": role,
        "content": content,
        "timestamp": now,
    }
    if tool_call:
        message["toolCall"] = tool_call
    if tool_result:
        message["toolResult"] = tool_result

    await db.chat_sessions.update_one(
        {"sessionId": session_id},
        {
            "$push": {"messages": message},
            "$set": {
                "updatedAt": now,
                "expiresAt": now + timedelta(days=7),
            },
            "$setOnInsert": {
                "sessionId": session_id,
                "userId": user_id,
                "createdAt": now,
            },
        },
        upsert=True,
    )


async def get_flow_state(session_id: str) -> dict:
    """Retrieve the active deterministic-flow state (currentFlow + per-flow sub-state)."""
    if db is None:
        return {}
    session = await db.chat_sessions.find_one({"sessionId": session_id})
    if not session:
        return {}
    return {
        "currentFlow": session.get("currentFlow"),
        "customBox": session.get("customBox") or {},
    }


async def save_flow_state(session_id: str, current_flow: Optional[str], custom_box: dict):
    """Persist the active flow and its sub-state. `current_flow=None` clears the lock."""
    if db is None:
        return
    now = datetime.now(timezone.utc)
    await db.chat_sessions.update_one(
        {"sessionId": session_id},
        {
            "$set": {
                "currentFlow": current_flow,
                "customBox": custom_box or {},
                "updatedAt": now,
                "expiresAt": now + timedelta(days=7),
            },
            "$setOnInsert": {
                "sessionId": session_id,
                "createdAt": now,
            },
        },
        upsert=True,
    )

# ─────────────────────────────────────────────────────────────────────────────
# SYSTEM PROMPT
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are Boxify Chef 🥕, a friendly AI assistant for Boxify — an Egyptian meal kit delivery service.

LANGUAGE RULE (most important):
- Detect the language of the user's message automatically.
- Always reply in the SAME language the user writes in.
- If the user writes in Arabic (Egyptian dialect or Modern Standard), reply in Arabic.
- If the user writes in English, reply in English.
- Never mix languages in a single reply.

YOUR CAPABILITIES:
1. **FAQ**: Answer questions about Boxify policies, delivery, subscriptions, payment, etc. Search the FAQ/knowledge base first.
2. **Recommend Boxes**: Suggest existing pre-made boxes based on user preferences.
3. **Build Custom Box**: Guide users through creating a custom meal box:
   - If the user explicitly mentions specific meals they want to include (e.g., "I want the molokhia and moussaka"), immediately search for those meals using the meal listing tool to verify their availability and retrieve their IDs.
   - If they haven't chosen meals yet, guide them step-by-step: ask about diet preferences/allergies, show available meals, and let them select.
   - Once the meals are identified (either via direct selection or step-by-step guidance), ask the user to confirm:
     1. The serving size (1, 2, 4, or 6 people)
     2. Whether they want a one-time purchase or subscription (weekly/monthly)
   - Do NOT call the box creation tool until the user has confirmed these details.
   - After they confirm, create the custom box, add it to their cart, and (if applicable) set up the subscription.

IMPORTANT RULES:
- Be warm, friendly, and concise (2-4 sentences per response)
- When recommending boxes or meals, present them clearly with names and prices
- NEVER invent box or meal names — only use data from tools
- When user wants to add something to cart, always confirm the serving size first
- For build-a-box flow, guide step by step — don't rush
- If user is not logged in and tries to use cart/box features, tell them to sign in first
- If question is not about food or Boxify, politely say you can only help with Boxify
- When presenting boxes, include the box ID so the frontend can render cards
- Format box recommendations as: **Box Name** — description, price, diet type"""

def detect_language(text: str) -> str:
    """Return 'ar' if the text contains Arabic script, otherwise 'en'."""
    return "ar" if any("\u0600" <= ch <= "\u06FF" for ch in text) else "en"

# ─────────────────────────────────────────────────────────────────────────────
# REQUEST / RESPONSE MODELS
# ─────────────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message:    str
    session_id: Optional[str] = Field(default="default", alias="sessionId")
    user_token: Optional[str] = Field(default=None, alias="userToken")
    model:      Optional[str] = Field(default=None)
    # Explicit, button-driven flow control (deterministic flows).
    # `flow` names the flow the user explicitly entered (e.g. "custom_box",
    # "recommendation", "faq"); `action` carries a structured UI action for the
    # active flow (e.g. {"type": "add_meal", "mealId": "..."}).
    flow:       Optional[str] = Field(default=None)
    action:     Optional[dict] = Field(default=None)
    # `language` kept for backwards-compatibility but is now ignored —
    # language is auto-detected from the message text.
    language:   Optional[str] = Field(default=None, exclude=True)
    model_config = {"populate_by_name": True}

# ─────────────────────────────────────────────────────────────────────────────
# GROQ RETRY HELPER
# ─────────────────────────────────────────────────────────────────────────────

async def groq_generate_with_retry(messages, model_id, max_retries=3):
    """Call Groq with exponential backoff on rate-limit or transient errors."""
    current_model = model_id
    for attempt in range(max_retries):
        try:
            response = await groq_client.chat.completions.create(
                model=current_model,
                messages=messages,
                tools=TOOL_DECLARATIONS,
                tool_choice="auto",
                temperature=0.0,
                max_tokens=800,
            )
            return response
        except Exception as e:
            error_str = str(e).lower()
            if ("429" in error_str or "rate_limit" in error_str) and current_model == "llama-3.3-70b-versatile":
                print(f"⚠️ Rate limit hit on {current_model}. Falling back to llama-3.1-8b-instant.")
                current_model = "llama-3.1-8b-instant"
                try:
                    response = await groq_client.chat.completions.create(
                        model=current_model,
                        messages=messages,
                        tools=TOOL_DECLARATIONS,
                        tool_choice="auto",
                        temperature=0.0,
                        max_tokens=800,
                    )
                    return response
                except Exception as inner_e:
                    e = inner_e
                    error_str = str(e).lower()
                    
            is_retryable = any(keyword in error_str for keyword in [
                "429", "rate_limit", "503", "unavailable", "500", "internal"
            ])
            if is_retryable and attempt < max_retries - 1:
                wait = (2 ** attempt) + random.uniform(0, 1)
                print(f"⏳ Groq retry {attempt + 1}/{max_retries} in {wait:.1f}s: {e}")
                await asyncio.sleep(wait)
            else:
                raise

# ─────────────────────────────────────────────────────────────────────────────
# BUILD-A-BOX DETERMINISTIC FLOW
# ─────────────────────────────────────────────────────────────────────────────
# A fixed, button-driven state machine that walks the user through building a
# custom box. The machine — not the LLM — decides every step. The LLM is used
# only to rephrase each step's canonical message (see narrate_step); if it fails
# we fall back to the canonical template, so the flow always works.

CUSTOM_BOX_SERVING_MULTIPLIERS = {1: 1, 2: 1.8, 4: 3.2, 6: 4.5}
MAX_QTY_PER_MEAL = 3
MAX_TOTAL_MEALS = 10

# State-machine step identifiers
BB_SELECTING    = "SELECTING"
BB_SERVING      = "ASK_SERVING"
BB_PURCHASE     = "ASK_PURCHASE"
BB_DELIVERY_DAY = "ASK_DELIVERY_DAY"   # subscription only
BB_ADDRESS      = "ASK_ADDRESS"        # subscription only
BB_CONFIRM      = "CONFIRM"

# Recurring delivery weekdays (must match the backend Subscription enum)
DELIVERY_DAYS = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"]
_DAY_LABELS_AR = {
    "saturday": "السبت", "sunday": "الأحد", "monday": "الإثنين",
    "tuesday": "الثلاثاء", "wednesday": "الأربعاء", "thursday": "الخميس",
    "friday": "الجمعة",
}

BUILD_BOX_SYSTEM_PROMPT = """You are Boxify Chef 🥕, guiding a user through a FIXED, step-by-step "build your own box" flow.
You will be given the canonical message for the current step. Your ONLY job is to rephrase it warmly and naturally, in 1-2 short sentences.
STRICT RULES:
- Keep every fact, number, price, meal name, and choice EXACTLY as given. Invent nothing, add nothing, remove nothing.
- Do NOT add new steps, options, meals, or questions.
- Never ask the user to type IDs.
- Reply in the SAME language as the user (Arabic Egyptian dialect or English). Never mix languages.
Return only the rephrased message text, nothing else."""


def _bb_text(key: str, lang: str, **kw) -> str:
    """Canonical bilingual copy for each build-a-box step."""
    en = {
        "intro": "Let's build your custom box! 🥕 Pick the meals you'd like below — tap ＋ to add. You can filter by diet too.",
        "filtered": "Showing {diet} meals. Tap ＋ to add the ones you like.",
        "need_one": "Please add at least one meal to your box before we continue. 🙂",
        "summary": "Your box so far: {items} — {count} meal(s), {price} EGP. Add more, or tap “Done selecting”.",
        "ask_serving": "Great choice! How many people is this box for?",
        "ask_purchase": "Perfect. Would you like this as a one-time order or a recurring subscription?",
        "ask_day": "Which day would you like your recurring deliveries?",
        "ask_address_saved": "Where should we deliver? Tap a saved address below, or type a new one as: street, city.",
        "ask_address_new": "What's your delivery address? Please type it as: street, city.",
        "address_need_city": "I need at least a street and a city. Please type it as: street, city.",
        "confirm": "Here's your box: {items}. Serving size {serving}, {ptype}. Total {price} EGP. Shall I create it?",
        "confirm_sub": "Here's your subscription: {items}. Serving size {serving}, {ptype}, delivered every {day} to {address}. Total {price} EGP per delivery. Shall I set it up?",
        "created_cart": "Done! 🎉 I created your custom box and added it to your cart. Total {price} EGP.",
        "created_sub": "Done! 🎉 Your {freq} for the custom box is all set up.",
        "cancelled": "No problem — I've cancelled the box builder. Want to do something else?",
        "create_failed": "Sorry, I couldn't create the box ({err}). Want to try again?",
        "login_required": "You'll need to sign in first so I can create and order your custom box. 🙂",
    }
    ar = {
        "intro": "يلا نبني البوكس بتاعك! 🥕 اختار الوجبات اللي تحبها من تحت — دوس ＋ عشان تضيف. وتقدر تفلتر حسب النظام الغذائي.",
        "filtered": "دي وجبات {diet}. دوس ＋ عشان تضيف اللي يعجبك.",
        "need_one": "ضيف وجبة واحدة على الأقل للبوكس قبل ما نكمّل. 🙂",
        "summary": "البوكس لحد دلوقتي: {items} — {count} وجبة، {price} جنيه. ضيف كمان، أو دوس «خلصت الاختيار».",
        "ask_serving": "اختيار جميل! البوكس ده لكام شخص؟",
        "ask_purchase": "تمام. تحبه طلب لمرة واحدة ولا اشتراك متكرر؟",
        "ask_day": "تحب يوصلك الاشتراك يوم إيه كل مرة؟",
        "ask_address_saved": "نوصّل فين؟ اختار عنوان محفوظ من تحت، أو اكتب عنوان جديد بالشكل: الشارع، المدينة.",
        "ask_address_new": "إيه عنوان التوصيل؟ اكتبه بالشكل ده: الشارع، المدينة.",
        "address_need_city": "محتاج على الأقل الشارع والمدينة. اكتبه بالشكل: الشارع، المدينة.",
        "confirm": "ده البوكس بتاعك: {items}. حجم التقديم {serving}، {ptype}. الإجمالي {price} جنيه. أعمله؟",
        "confirm_sub": "ده اشتراكك: {items}. حجم التقديم {serving}، {ptype}، بيتوصّل كل {day} على {address}. الإجمالي {price} جنيه لكل توصيلة. أظبطه؟",
        "created_cart": "تمام! 🎉 عملت البوكس المخصص وضفته للسلة. الإجمالي {price} جنيه.",
        "created_sub": "تمام! 🎉 {freq} للبوكس المخصص اتظبط.",
        "cancelled": "ولا يهمك — لغيت بناء البوكس. تحب نعمل حاجة تانية؟",
        "create_failed": "معلش، مقدرتش أعمل البوكس ({err}). نجرب تاني؟",
        "login_required": "محتاج تسجّل دخول الأول عشان أقدر أعمل وأطلب البوكس المخصص. 🙂",
    }
    table = ar if lang == "ar" else en
    return table.get(key, "").format(**kw)


_DIET_CHIP_DEFS = [
    ("all", "All", "الكل"), ("vegan", "Vegan", "نباتي"),
    ("vegetarian", "Vegetarian", "نباتي كامل"), ("keto", "Keto", "كيتو"),
    ("paleo", "Paleo", "باليو"), ("standard", "Standard", "عادي"),
]


def _ptype_label(ptype: str, lang: str) -> str:
    if lang == "ar":
        return {"one_time": "طلب لمرة واحدة", "weekly": "اشتراك أسبوعي", "monthly": "اشتراك شهري"}.get(ptype, ptype)
    return {"one_time": "one-time order", "weekly": "weekly subscription", "monthly": "monthly subscription"}.get(ptype, ptype)


def _diet_chips(lang: str, active: str) -> list:
    chips = []
    for val, en, ar in _DIET_CHIP_DEFS:
        label = ar if lang == "ar" else en
        prefix = "✓ " if (active or "all") == val else ""
        chips.append({"text": prefix + label, "action": {"type": "set_diet", "diet": val}})
    return chips


def _selecting_quick_actions(lang: str, active_diet: str, has_selection: bool) -> list:
    actions = _diet_chips(lang, active_diet)
    if has_selection:
        actions.append({"text": "خلصت الاختيار ←" if lang == "ar" else "Done selecting →",
                        "action": {"type": "done_selecting"}})
    actions.append({"text": "إلغاء" if lang == "ar" else "Cancel", "action": {"type": "cancel"}})
    return actions


def _serving_quick_actions(lang: str) -> list:
    actions = []
    for s in (1, 2, 4, 6):
        if lang == "ar":
            unit = "فرد" if s == 1 else "أفراد"
        else:
            unit = "person" if s == 1 else "people"
        actions.append({"text": f"{s} {unit}", "action": {"type": "set_serving", "size": s}})
    actions.append({"text": "إلغاء" if lang == "ar" else "Cancel", "action": {"type": "cancel"}})
    return actions


def _purchase_quick_actions(lang: str) -> list:
    if lang == "ar":
        opts = [("one_time", "لمرة واحدة"), ("weekly", "اشتراك أسبوعي"), ("monthly", "اشتراك شهري")]
        cancel = "إلغاء"
    else:
        opts = [("one_time", "One-time"), ("weekly", "Weekly subscription"), ("monthly", "Monthly subscription")]
        cancel = "Cancel"
    actions = [{"text": lbl, "action": {"type": "set_purchase", "mode": mode}} for mode, lbl in opts]
    actions.append({"text": cancel, "action": {"type": "cancel"}})
    return actions


def _confirm_quick_actions(lang: str) -> list:
    if lang == "ar":
        return [
            {"text": "أكّد واعمل البوكس ✅", "action": {"type": "confirm"}},
            {"text": "رجوع للوجبات", "action": {"type": "edit"}},
            {"text": "إلغاء", "action": {"type": "cancel"}},
        ]
    return [
        {"text": "Confirm & create ✅", "action": {"type": "confirm"}},
        {"text": "Back to meals", "action": {"type": "edit"}},
        {"text": "Cancel", "action": {"type": "cancel"}},
    ]


def _day_chips(lang: str) -> list:
    chips = []
    for day in DELIVERY_DAYS:
        label = _DAY_LABELS_AR[day] if lang == "ar" else day.capitalize()
        chips.append({"text": label, "action": {"type": "set_day", "day": day}})
    chips.append({"text": "إلغاء" if lang == "ar" else "Cancel", "action": {"type": "cancel"}})
    return chips


def _day_label(day: str, lang: str) -> str:
    return _DAY_LABELS_AR.get(day, day) if lang == "ar" else (day or "").capitalize()


def _address_label(addr: dict) -> str:
    if not addr:
        return ""
    parts = [addr.get("street"), addr.get("city")]
    return ", ".join([p for p in parts if p])


def _address_quick_actions(lang: str, saved: list) -> list:
    actions = []
    for i, addr in enumerate(saved[:3]):
        label = _address_label(addr)
        if label:
            actions.append({"text": ("📍 " + label), "action": {"type": "use_address", "index": i}})
    actions.append({"text": "إلغاء" if lang == "ar" else "Cancel", "action": {"type": "cancel"}})
    return actions


def _parse_address_text(text: str) -> Optional[dict]:
    """Parse a typed address of the form 'street, city[, country]'. Returns None
    if a street and city can't be identified."""
    if not text:
        return None
    parts = [p.strip() for p in re.split(r"[,،]", text) if p.strip()]
    if len(parts) < 2:
        return None
    addr = {"street": parts[0], "city": parts[1]}
    if len(parts) >= 3:
        addr["country"] = parts[2]
    return addr


async def _fetch_user_addresses(user_token: Optional[str]) -> list:
    if not user_token:
        return []
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{BACKEND_URL}/api/auth/me",
                headers={"Authorization": f"Bearer {user_token}"},
            )
            if resp.status_code >= 400:
                return []
            return (resp.json().get("user", {}) or {}).get("addresses", []) or []
    except Exception:
        return []


def _items_str(selection: dict, lang: str) -> str:
    parts = []
    for v in selection.values():
        qty = int(v.get("qty", 1))
        name = v.get("name") or ""
        parts.append(f"{name} ×{qty}" if qty > 1 else name)
    return ("، " if lang == "ar" else ", ").join(parts)


def _selection_count(selection: dict) -> int:
    return sum(int(v.get("qty", 1)) for v in selection.values())


def _selection_items(selection: dict) -> list:
    return [
        {"id": mid, "name": v.get("name"), "price": v.get("price"), "qty": int(v.get("qty", 1))}
        for mid, v in selection.items()
    ]


def _expand_meal_ids(selection: dict) -> list:
    ids = []
    for mid, v in selection.items():
        ids.extend([mid] * int(v.get("qty", 1)))
    return ids


def _base_price(selection: dict) -> float:
    return round(sum(float(v.get("price") or 0) * int(v.get("qty", 1)) for v in selection.values()), 2)


def _bb_price_info(selection: dict, serving_size: Optional[int] = None, preview: Optional[dict] = None) -> dict:
    base = _base_price(selection)
    info = {"basePrice": base, "count": _selection_count(selection)}
    if serving_size:
        mult = CUSTOM_BOX_SERVING_MULTIPLIERS.get(serving_size, 1)
        info["servingSize"] = serving_size
        info["totalPrice"] = round(preview.get("priceForServingSize"), 2) if preview and preview.get("priceForServingSize") is not None else round(base * mult, 2)
        if preview:
            info["totalCalories"] = preview.get("totalCalories")
            info["allergens"] = preview.get("allergens", [])
    else:
        info["totalPrice"] = base
    return info


def _selectable_meals(menu: list, selection: dict) -> list:
    out = []
    for m in menu:
        mid = m.get("id")
        out.append({**m, "selectedQty": int(selection.get(mid, {}).get("qty", 0)) if mid in selection else 0})
    return out


def _bb_add(selection: dict, menu: list, meal_id: str, delta: int):
    """Add/adjust a meal in the selection, enforcing per-meal and total caps."""
    if not meal_id:
        return
    menu_item = next((m for m in menu if m.get("id") == meal_id), None)
    current = int(selection.get(meal_id, {}).get("qty", 0))
    new_qty = current + delta
    if new_qty <= 0:
        selection.pop(meal_id, None)
        return
    new_qty = min(new_qty, MAX_QTY_PER_MEAL)
    total_others = sum(int(v.get("qty", 1)) for k, v in selection.items() if k != meal_id)
    if total_others + new_qty > MAX_TOTAL_MEALS:
        new_qty = MAX_TOTAL_MEALS - total_others
        if new_qty <= 0:
            return
    name = (menu_item or {}).get("name") or selection.get(meal_id, {}).get("name")
    price = (menu_item or {}).get("price") if menu_item else selection.get(meal_id, {}).get("price")
    selection[meal_id] = {"name": name, "price": price, "qty": new_qty}


def _match_meals_from_text(text: str, menu: list) -> list:
    """Fallback: resolve typed meal names or list positions to meal IDs."""
    if not text or not menu:
        return []
    lower = text.lower()
    matched = []
    for n in re.findall(r"\b(\d{1,2})\b", lower):
        idx = int(n) - 1
        if 0 <= idx < len(menu):
            matched.append(menu[idx].get("id"))
    for m in menu:
        name = (m.get("name") or "").lower()
        if name and name in lower:
            matched.append(m.get("id"))
    return list(dict.fromkeys([m for m in matched if m]))


def _has_confirm_text(text: str) -> bool:
    low = (text or "").lower()
    return any(w in low for w in [
        "confirm", "yes", "yeah", "create", "go ahead", "ok", "okay", "sure",
        "تمام", "اكد", "أكد", "اعمل", "ايوه", "أيوة", "نعم", "ماشي",
    ])


def _bb_response(answer: str, step: Optional[str], *, meals=None, selection=None,
                 price=None, quick_actions=None, tool_calls=None) -> dict:
    resp = {
        "answer": answer,
        "source": "build_box",
        "flow": "custom_box" if step else None,
        "flowState": step,
        "toolCalls": tool_calls or [],
        "model": MODEL_ID,
        "mode": "custom_box",
        "modeConfidence": 1.0,
    }
    if meals is not None:
        resp["selectableMeals"] = meals
    if selection is not None:
        resp["selection"] = selection
    if price is not None:
        resp["priceInfo"] = price
    if quick_actions is not None:
        resp["quickActions"] = quick_actions
    return resp


async def narrate_step(canonical_text: str, lang: str) -> str:
    """Rephrase a canonical step message via the LLM (fixed build-box prompt).
    Falls back to the canonical text on any error or during tests."""
    if not canonical_text:
        return canonical_text
    if "PYTEST_CURRENT_TEST" in os.environ:
        return canonical_text
    try:
        resp = await groq_client.chat.completions.create(
            model=MODEL_ID,
            messages=[
                {"role": "system", "content": BUILD_BOX_SYSTEM_PROMPT},
                {"role": "user", "content": f"User language: {lang}. Rephrase this step message, keeping every fact, number, price, meal name and choice exactly the same:\n\n{canonical_text}"},
            ],
            temperature=0.3,
            max_tokens=220,
        )
        out = (resp.choices[0].message.content or "").strip()
        return out or canonical_text
    except Exception:
        return canonical_text


async def _calculate_custom_box(meal_ids: list, serving_size: int, user_token: Optional[str]) -> Optional[dict]:
    """Call the backend price/calorie/allergen preview endpoint. Returns the
    `preview` object or None on failure (auth required)."""
    headers = {"Content-Type": "application/json"}
    if user_token:
        headers["Authorization"] = f"Bearer {user_token}"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{BACKEND_URL}/api/boxes/custom/calculate",
                headers=headers,
                json={"mealIds": meal_ids, "servingSize": serving_size},
            )
            if resp.status_code >= 400:
                return None
            return resp.json().get("preview")
    except Exception:
        return None


async def _bb_fetch_menu(diet: str, user_token: Optional[str], lang: str) -> list:
    args = {}
    if diet and diet != "all":
        args["dietType"] = diet
    result = await execute_tool("get_available_meals", args, user_token, lang)
    return result.get("meals", []) if isinstance(result, dict) else []


async def _bb_confirm_step(state: dict, selection: dict, sid: str,
                           user_token: Optional[str], lang: str) -> dict:
    """Compute the live price and build the CONFIRM response (one-time or subscription)."""
    serving = state.get("servingSize", 2)
    ptype = state.get("purchaseType", "one_time")
    preview = await _calculate_custom_box(_expand_meal_ids(selection), serving, user_token)
    price = _bb_price_info(selection, serving, preview)
    state["priceInfo"] = price
    state["step"] = BB_CONFIRM
    if ptype == "one_time":
        canonical = _bb_text("confirm", lang, items=_items_str(selection, lang),
                             serving=serving, ptype=_ptype_label(ptype, lang),
                             price=price.get("totalPrice"))
    else:
        canonical = _bb_text("confirm_sub", lang, items=_items_str(selection, lang),
                             serving=serving, ptype=_ptype_label(ptype, lang),
                             day=_day_label(state.get("deliveryDay"), lang),
                             address=_address_label(state.get("deliveryAddress")),
                             price=price.get("totalPrice"))
    txt = await narrate_step(canonical, lang)
    await save_session_message(sid, "model", txt)
    return _bb_response(txt, BB_CONFIRM, selection=_selection_items(selection),
                        price=price, quick_actions=_confirm_quick_actions(lang))


async def handle_custom_box_flow(req: "ChatRequest", sid: str, user_token: Optional[str],
                                 lang: str, state: dict, action: dict) -> tuple[dict, Optional[dict]]:
    """Deterministic build-a-box state machine.

    Returns (response, new_state). `new_state is None` means the flow ended (or
    was cancelled) and the lock should be released.
    """
    state = dict(state or {})
    action = action or {}
    atype = action.get("type")
    message = req.message or ""

    # Persist typed messages for the transcript (no-op when db is unavailable)
    if message and atype in (None, "", "start"):
        await save_session_message(sid, "user", message)

    # Cancel from any step
    if atype == "cancel":
        txt = await narrate_step(_bb_text("cancelled", lang), lang)
        await save_session_message(sid, "model", txt)
        return _bb_response(txt, None), None

    step = state.get("step")
    selection = state.get("selection") or {}
    diet = state.get("dietFilter") or "all"

    # ── START / fresh entry ────────────────────────────────────────────────
    if not step or atype == "start":
        menu = await _bb_fetch_menu(diet, user_token, lang)
        state = {"step": BB_SELECTING, "selection": selection, "dietFilter": diet, "menu": menu}
        txt = await narrate_step(_bb_text("intro", lang), lang)
        await save_session_message(sid, "model", txt)
        return _bb_response(
            txt, BB_SELECTING,
            meals=_selectable_meals(menu, selection),
            selection=_selection_items(selection),
            price=_bb_price_info(selection),
            quick_actions=_selecting_quick_actions(lang, diet, bool(selection)),
        ), state

    # ── SELECTING ──────────────────────────────────────────────────────────
    if step == BB_SELECTING:
        menu = state.get("menu") or []
        ack = None
        if atype == "set_diet":
            diet = action.get("diet") or "all"
            menu = await _bb_fetch_menu(diet, user_token, lang)
            state["dietFilter"] = diet
            state["menu"] = menu
            label = next((a if lang == "ar" else e for v, e, a in _DIET_CHIP_DEFS if v == diet), diet)
            ack = _bb_text("filtered", lang, diet=label)
        elif atype == "add_meal":
            _bb_add(selection, menu, action.get("mealId"), +1)
        elif atype == "change_qty":
            _bb_add(selection, menu, action.get("mealId"), int(action.get("delta", 0)))
        elif atype == "done_selecting":
            if not selection:
                txt = _bb_text("need_one", lang)
                return _bb_response(
                    txt, BB_SELECTING,
                    meals=_selectable_meals(menu, selection),
                    selection=_selection_items(selection),
                    price=_bb_price_info(selection),
                    quick_actions=_selecting_quick_actions(lang, diet, False),
                ), state
            state["step"] = BB_SERVING
            state["selection"] = selection
            txt = await narrate_step(_bb_text("ask_serving", lang), lang)
            await save_session_message(sid, "model", txt)
            return _bb_response(
                txt, BB_SERVING,
                selection=_selection_items(selection),
                price=_bb_price_info(selection),
                quick_actions=_serving_quick_actions(lang),
            ), state
        else:
            # Free-text fallback: match typed meal names / list positions
            for mid in _match_meals_from_text(message, menu):
                _bb_add(selection, menu, mid, +1)

        state["selection"] = selection
        if ack is None:
            if selection:
                ack = _bb_text("summary", lang, items=_items_str(selection, lang),
                               count=_selection_count(selection), price=int(_base_price(selection)))
            else:
                ack = _bb_text("intro", lang)
        return _bb_response(
            ack, BB_SELECTING,
            meals=_selectable_meals(menu, selection),
            selection=_selection_items(selection),
            price=_bb_price_info(selection),
            quick_actions=_selecting_quick_actions(lang, diet, bool(selection)),
        ), state

    # ── ASK_SERVING ─────────────────────────────────────────────────────────
    if step == BB_SERVING:
        size = int(action.get("size")) if atype == "set_serving" and action.get("size") else _extract_serving_size(message)
        if size not in (1, 2, 4, 6):
            txt = _bb_text("ask_serving", lang)
            return _bb_response(txt, BB_SERVING, selection=_selection_items(selection),
                                price=_bb_price_info(selection), quick_actions=_serving_quick_actions(lang)), state
        state["servingSize"] = size
        state["step"] = BB_PURCHASE
        txt = await narrate_step(_bb_text("ask_purchase", lang), lang)
        await save_session_message(sid, "model", txt)
        return _bb_response(txt, BB_PURCHASE, selection=_selection_items(selection),
                            price=_bb_price_info(selection, size), quick_actions=_purchase_quick_actions(lang)), state

    # ── ASK_PURCHASE ────────────────────────────────────────────────────────
    if step == BB_PURCHASE:
        mode = None
        if atype == "set_purchase":
            mode = action.get("mode")
        else:
            mode = _extract_frequency(message)
            if not mode and any(w in message.lower() for w in ["one time", "one-time", "once", "single", "لمرة", "مرة واحدة", "مره واحده"]):
                mode = "one_time"
        if mode not in ("one_time", "weekly", "monthly"):
            txt = _bb_text("ask_purchase", lang)
            return _bb_response(txt, BB_PURCHASE, selection=_selection_items(selection),
                                quick_actions=_purchase_quick_actions(lang)), state
        state["purchaseType"] = mode
        if mode == "one_time":
            resp = await _bb_confirm_step(state, selection, sid, user_token, lang)
            return resp, state
        # Subscription → collect the recurring delivery day, then the address
        state["step"] = BB_DELIVERY_DAY
        txt = await narrate_step(_bb_text("ask_day", lang), lang)
        await save_session_message(sid, "model", txt)
        return _bb_response(txt, BB_DELIVERY_DAY, selection=_selection_items(selection),
                            quick_actions=_day_chips(lang)), state

    # ── ASK_DELIVERY_DAY (subscription only) ────────────────────────────────
    if step == BB_DELIVERY_DAY:
        day = None
        if atype == "set_day":
            day = action.get("day")
        else:
            low = message.lower()
            for d in DELIVERY_DAYS:
                if d in low or _DAY_LABELS_AR[d] in message:
                    day = d
                    break
        if day not in DELIVERY_DAYS:
            txt = _bb_text("ask_day", lang)
            return _bb_response(txt, BB_DELIVERY_DAY, selection=_selection_items(selection),
                                quick_actions=_day_chips(lang)), state
        state["deliveryDay"] = day
        state["step"] = BB_ADDRESS
        saved = await _fetch_user_addresses(user_token)
        state["savedAddresses"] = saved
        key = "ask_address_saved" if saved else "ask_address_new"
        txt = await narrate_step(_bb_text(key, lang), lang)
        await save_session_message(sid, "model", txt)
        return _bb_response(txt, BB_ADDRESS, selection=_selection_items(selection),
                            quick_actions=_address_quick_actions(lang, saved)), state

    # ── ASK_ADDRESS (subscription only) ─────────────────────────────────────
    if step == BB_ADDRESS:
        addr = None
        if atype == "use_address":
            saved = state.get("savedAddresses") or []
            idx = int(action.get("index", -1))
            if 0 <= idx < len(saved):
                a = saved[idx]
                addr = {"street": a.get("street"), "city": a.get("city")}
                if a.get("country"):
                    addr["country"] = a.get("country")
                if a.get("postalCode"):
                    addr["postalCode"] = a.get("postalCode")
        else:
            addr = _parse_address_text(message)
        if not addr or not addr.get("street") or not addr.get("city"):
            saved = state.get("savedAddresses") or []
            txt = _bb_text("address_need_city", lang)
            return _bb_response(txt, BB_ADDRESS, selection=_selection_items(selection),
                                quick_actions=_address_quick_actions(lang, saved)), state
        state["deliveryAddress"] = addr
        resp = await _bb_confirm_step(state, selection, sid, user_token, lang)
        return resp, state

    # ── CONFIRM ─────────────────────────────────────────────────────────────
    if step == BB_CONFIRM:
        if atype == "edit":
            state["step"] = BB_SELECTING
            menu = state.get("menu") or await _bb_fetch_menu(diet, user_token, lang)
            state["menu"] = menu
            txt = await narrate_step(_bb_text("intro", lang), lang)
            return _bb_response(txt, BB_SELECTING, meals=_selectable_meals(menu, selection),
                                selection=_selection_items(selection), price=_bb_price_info(selection),
                                quick_actions=_selecting_quick_actions(lang, diet, bool(selection))), state

        if atype == "confirm" or _has_confirm_text(message):
            if not user_token:
                txt = await narrate_step(_bb_text("login_required", lang), lang)
                await save_session_message(sid, "model", txt)
                return _bb_response(txt, BB_CONFIRM, selection=_selection_items(selection),
                                    price=state.get("priceInfo"), quick_actions=_confirm_quick_actions(lang)), state

            serving = state.get("servingSize", 2)
            ptype = state.get("purchaseType", "one_time")
            meal_ids = _expand_meal_ids(selection)
            tool_calls = []

            create_args = {"mealIds": meal_ids, "servingSize": serving}
            create_res = await execute_tool("create_custom_box", create_args, user_token, lang)
            tool_calls.append({"tool": "create_custom_box", "args": create_args, "result": create_res})
            if not isinstance(create_res, dict) or not create_res.get("success"):
                err = (create_res or {}).get("error", "unknown error")
                txt = await narrate_step(_bb_text("create_failed", lang, err=err), lang)
                await save_session_message(sid, "model", txt)
                return _bb_response(txt, BB_CONFIRM, selection=_selection_items(selection),
                                    price=state.get("priceInfo"), quick_actions=_confirm_quick_actions(lang),
                                    tool_calls=tool_calls), state

            box_id = create_res.get("boxId")
            if ptype == "one_time":
                cart_args = {"boxId": box_id, "servingSize": serving, "quantity": 1}
                cart_res = await execute_tool("add_to_cart", cart_args, user_token, lang)
                tool_calls.append({"tool": "add_to_cart", "args": cart_args, "result": cart_res})
                total = (cart_res or {}).get("cartTotal") or (state.get("priceInfo") or {}).get("totalPrice")
                txt = await narrate_step(_bb_text("created_cart", lang, price=total), lang)
            else:
                sub_args = {"boxId": box_id, "servingSize": serving, "frequency": ptype,
                            "deliveryDay": state.get("deliveryDay"),
                            "deliveryAddress": state.get("deliveryAddress")}
                sub_res = await execute_tool("create_subscription", sub_args, user_token, lang)
                tool_calls.append({"tool": "create_subscription", "args": sub_args, "result": sub_res})
                txt = await narrate_step(_bb_text("created_sub", lang, freq=_ptype_label(ptype, lang)), lang)

            await save_session_message(sid, "model", txt)
            return _bb_response(txt, None, tool_calls=tool_calls), None

        # Unrecognized input at confirm — re-prompt
        txt = _bb_text("confirm", lang, items=_items_str(selection, lang),
                       serving=state.get("servingSize", 2),
                       ptype=_ptype_label(state.get("purchaseType", "one_time"), lang),
                       price=(state.get("priceInfo") or {}).get("totalPrice"))
        return _bb_response(txt, BB_CONFIRM, selection=_selection_items(selection),
                            price=state.get("priceInfo"), quick_actions=_confirm_quick_actions(lang)), state

    # Unknown step — restart the flow defensively
    return await handle_custom_box_flow(req, sid, user_token, lang, {}, {"type": "start"})


# ─────────────────────────────────────────────────────────────────────────────
# MAIN CHAT ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "Boxify AI Service v2.0 🥕", "model": MODEL_ID}


def _build_messages(history: list, user_message: str | None = None, mode: str | None = None) -> list:
    system = SYSTEM_PROMPT
    if mode:
        system += f"\n\nROUTER MODE: {mode}. Follow this mode unless the user clearly changes intent."
    messages = [{"role": "system", "content": system}]
    for msg in history[-10:]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "user":
            messages.append({"role": "user", "content": content})
        elif role == "model":
            messages.append({"role": "assistant", "content": content})
    if user_message is not None:
        messages.append({"role": "user", "content": user_message})
    return messages


async def _run_react_loop(messages: list, sid: str, user_token: str | None, lang: str,
                          model_id: str, tool_calls_made: list | None = None,
                          mode: str = "dialogue", confidence: float = 0.0) -> dict:
    tool_calls_made = tool_calls_made or []
    for _ in range(5):
        response = await groq_generate_with_retry(messages, model_id)
        assistant_msg = response.choices[0].message
        tool_calls = assistant_msg.tool_calls

        if not tool_calls:
            answer = assistant_msg.content or ""
            if not answer.strip():
                answer = "Sorry, I couldn't process that. Could you rephrase?"
            await save_session_message(sid, "model", answer)
            return {
                "answer": answer,
                "source": "groq",
                "toolCalls": tool_calls_made,
                "model": model_id,
                "mode": mode,
                "modeConfidence": confidence,
            }

        messages.append(assistant_msg)
        for tool_call in tool_calls:
            tool_name = tool_call.function.name
            tool_args = json.loads(tool_call.function.arguments) if tool_call.function.arguments else {}
            result = await execute_tool(tool_name, tool_args, user_token, lang)
            tool_calls_made.append({"tool": tool_name, "args": tool_args, "result": result})
            await save_session_message(
                sid,
                "tool",
                json.dumps(result, default=str),
                tool_call={"name": tool_name, "args": tool_args},
            )
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": tool_name,
                "content": json.dumps(result, default=str),
            })

    return {
        "answer": "I'm having trouble processing your request. Could you try again?",
        "source": "error",
        "toolCalls": tool_calls_made,
        "model": model_id,
        "mode": mode,
        "modeConfidence": confidence,
    }


async def _prefetch_tool_then_narrate(tool_name: str, tool_args: dict, tool_result: dict,
                                      history: list, sid: str, req_message: str,
                                      user_token: str | None, lang: str, model_id: str,
                                      mode: str, confidence: float) -> dict:
    await save_session_message(sid, "user", req_message)
    messages = _build_messages(history, mode=mode)
    simulated_tool_call_id = "call_" + "".join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789", k=10))
    messages.append({
        "role": "assistant",
        "content": None,
        "tool_calls": [{
            "id": simulated_tool_call_id,
            "type": "function",
            "function": {"name": tool_name, "arguments": json.dumps(tool_args)},
        }],
    })
    messages.append({
        "role": "tool",
        "tool_call_id": simulated_tool_call_id,
        "name": tool_name,
        "content": json.dumps(tool_result, default=str),
    })
    await save_session_message(
        sid,
        "tool",
        json.dumps(tool_result, default=str),
        tool_call={"name": tool_name, "args": tool_args},
    )
    return await _run_react_loop(
        messages,
        sid,
        user_token,
        lang,
        model_id,
        [{"tool": tool_name, "args": tool_args, "result": tool_result}],
        mode,
        confidence,
    )


def _standard_boxify_dialogue(req_message: str, lang: str) -> Optional[str]:
    lower = req_message.lower().strip()
    if any(word in lower for word in ["joke", "football", "weather", "movie"]) or "نكتة" in req_message:
        if lang == "ar":
            return "أقدر أساعدك في أسئلة Boxify والأكل والطلبات فقط. تحب أرشح لك بوكس مناسب؟"
        return "I can help with Boxify food, boxes, orders, and subscriptions. Want me to recommend a meal box instead?"
    return None


@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        sid  = req.session_id or "default"
        user_token = req.user_token
        model_id = req.model or MODEL_ID

        # Auto-detect language from the user's message
        lang = detect_language(req.message)

        is_testing = "PYTEST_CURRENT_TEST" in os.environ and not getattr(sys.modules[__name__], "FORCE_FAST_PATH", False)

        # ── Explicit / locked deterministic flows ─────────────────────────────
        flow_state = await get_flow_state(sid)
        active_flow = (flow_state or {}).get("currentFlow")
        incoming_flow = req.flow
        action = req.action or {}

        enter_custom = False
        if incoming_flow == "custom_box" or active_flow == "custom_box":
            enter_custom = True
        elif not incoming_flow and not active_flow and not is_testing:
            # Free-typed build-a-box requests also enter the deterministic flow
            if determine_next_mode(req.message, lang, None)[0] == "custom_box":
                enter_custom = True

        if enter_custom:
            custom_state = (flow_state or {}).get("customBox") or {}
            if incoming_flow == "custom_box" and action.get("type") == "start":
                custom_state = {}
            response, new_state = await handle_custom_box_flow(req, sid, user_token, lang, custom_state, action)
            await save_flow_state(sid, "custom_box" if new_state is not None else None, new_state or {})
            return response

        # A non-custom explicit flow releases any locked custom-box flow
        if active_flow == "custom_box" and incoming_flow and incoming_flow != "custom_box":
            await save_flow_state(sid, None, {})

        history = await get_session_history(sid)

        # Load session mode, determine next mode, and save it (explicit flow wins)
        current_mode = await get_session_mode(sid)
        if incoming_flow in ("recommendation", "faq", "dialogue"):
            mode, confidence, reason = incoming_flow, 1.0, "explicit_flow"
        else:
            mode, confidence, reason = determine_next_mode(req.message, lang, current_mode)
        await save_session_mode(sid, mode)

        # ── Intent Router (Phase 3) ───────────────────────────────────────────
        if not is_testing:
            intent = mode
            
            # FAQ fast path: skip Gemini entirely for clear FAQ matches
            if intent == 'faq':
                faq_answer = search_faq(req.message, lang)
                if faq_answer:
                    await save_session_message(sid, "user", req.message)
                    await save_session_message(sid, "model", faq_answer)
                    return {
                        "answer": faq_answer,
                        "source": "bm25_faq",
                        "toolCalls": [],
                        "model": model_id,
                        "mode": mode,
                        "modeConfidence": confidence,
                    }
                    
            # Recommendation fast path: pre-fetch recommend_box and feed to Gemini in a single turn
            elif intent == 'recommendation':
                diet_hint = _extract_diet_hint(req.message)
                rec_args = {}
                if diet_hint:
                    rec_args["dietType"] = diet_hint
                preferences = _extract_preferences(req.message)
                if preferences:
                    rec_args["preferences"] = preferences
                max_price = preferences.get("maxPrice") if preferences else None
                if max_price:
                    rec_args["maxPrice"] = max_price
                    
                rec_result = await execute_tool("recommend_box", rec_args, user_token, lang)
                
                # Save user message to session
                await save_session_message(sid, "user", req.message)
                
                # Build conversation history
                history = await get_session_history(sid)
                messages = _build_messages(history, mode=mode)
                        
                # Append pre-fetched tool interaction directly to messages
                simulated_tool_call_id = "call_" + "".join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789", k=10))
                messages.append({
                    "role": "assistant",
                    "content": None,
                    "tool_calls": [
                        {
                            "id": simulated_tool_call_id,
                            "type": "function",
                            "function": {
                                "name": "recommend_box",
                                "arguments": json.dumps(rec_args)
                            }
                        }
                    ]
                })
                messages.append({
                    "role": "tool",
                    "tool_call_id": simulated_tool_call_id,
                    "name": "recommend_box",
                    "content": json.dumps(rec_result, default=str),
                })
                
                # Save pre-fetched tool call to DB
                await save_session_message(sid, "tool", json.dumps(rec_result, default=str),
                                     tool_call={"name": "recommend_box", "args": rec_args})
                                     
                # Now invoke the ReAct loop directly, which will generate the final narration
                return await _run_react_loop(
                    messages,
                    sid,
                    user_token,
                    lang,
                    model_id,
                    [{"tool": "recommend_box", "args": rec_args, "result": rec_result}],
                    mode,
                    confidence,
                )

            elif intent == 'dialogue':
                direct_answer = _standard_boxify_dialogue(req.message, lang)
                if direct_answer:
                    await save_session_message(sid, "user", req.message)
                    await save_session_message(sid, "model", direct_answer)
                    return {
                        "answer": direct_answer,
                        "source": "groq",
                        "toolCalls": [],
                        "model": model_id,
                        "mode": mode,
                        "modeConfidence": confidence,
                    }

        # Build conversation history from MongoDB (Standard ReAct path)
        history = await get_session_history(sid)

        # Convert history to OpenAI/Groq message format
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ]
        for msg in history[-10:]:  # Keep last 10 messages for context
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "user":
                messages.append({"role": "user", "content": content})
            elif role == "model":
                messages.append({"role": "assistant", "content": content})

        # Save user message to session
        await save_session_message(sid, "user", req.message)

        # Add the new user message
        messages.append({"role": "user", "content": req.message})

        # ReAct loop: keep calling Groq until we get a text response
        max_iterations = 5
        tool_calls_made = []

        for iteration in range(max_iterations):
            response = await groq_generate_with_retry(messages, model_id)
            assistant_msg = response.choices[0].message
            tool_calls = assistant_msg.tool_calls

            if not tool_calls:
                answer = assistant_msg.content or ""
                if not answer.strip():
                    answer = "Sorry, I couldn't process that. Could you rephrase?"

                # Save assistant response
                await save_session_message(sid, "model", answer)

                return {
                    "answer": answer,
                    "source": "groq",
                    "toolCalls": tool_calls_made,
                    "model": model_id,
                    "mode": mode,
                    "modeConfidence": confidence,
                }

            # Process function calls
            # Add the model's response (with function calls) to history
            messages.append(assistant_msg)

            # Execute each function call and build response parts
            for tool_call in tool_calls:
                tool_name = tool_call.function.name
                tool_args = json.loads(tool_call.function.arguments) if tool_call.function.arguments else {}

                print(f"🔧 Tool call: {tool_name}({json.dumps(tool_args, default=str)})")

                # Pass detected language so search_faq returns the right answer field
                result = await execute_tool(tool_name, tool_args, user_token, lang)
                tool_calls_made.append({
                    "tool": tool_name,
                    "args": tool_args,
                    "result": result,
                })

                print(f"✅ Tool result: {json.dumps(result, default=str)[:200]}")

                # Save tool interaction
                await save_session_message(sid, "tool", json.dumps(result, default=str),
                                     tool_call={"name": tool_name, "args": tool_args})

                # Append tool response part
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": tool_name,
                    "content": json.dumps(result, default=str),
                })

        # If we hit max iterations, return a neutral fallback
        return {
            "answer": "I'm having trouble processing your request. Could you try again?",
            "source": "error",
            "toolCalls": tool_calls_made,
            "model": model_id,
            "mode": mode,
            "modeConfidence": confidence,
        }

    except Exception as e:
        print(f"❌ Chat error: {e}")
        import traceback
        traceback.print_exc()

        mode_val = locals().get("mode", "dialogue")
        conf_val = locals().get("confidence", 0.0)

        # Attempt FAQ fallback for simple questions
        try:
            faq_answer = search_faq(req.message, detect_language(req.message))
            if faq_answer:
                return {
                    "answer": faq_answer,
                    "source": "faq_fallback",
                    "toolCalls": [],
                    "model": model_id,
                    "mode": mode_val,
                    "modeConfidence": conf_val,
                }
        except Exception:
            pass

        return {
            "answer": "I'm experiencing high demand right now. Please try again in a moment! 😊",
            "source": "error",
            "model": model_id,
            "mode": mode_val,
            "modeConfidence": conf_val,
        }


@app.delete("/session/{session_id}")
async def clear_session(session_id: str):
    """Clear a chat session's history."""
    if db is not None:
        await db.chat_sessions.delete_one({"sessionId": session_id})
    return {"message": "Session cleared"}


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


def _extract_price_hint(text: str) -> Optional[float]:
    lower = text.lower()
    match = re.search(r"(?:under|below|less than|max(?:imum)?|budget|حد اقصى|اقل من|تحت)\s*(\d{2,5})", lower)
    if not match:
        match = re.search(r"(\d{2,5})\s*(?:egp|جنيه)", lower)
    return float(match.group(1)) if match else None


def _extract_preferences(text: str) -> dict:
    prefs = {}
    diet = _extract_diet_hint(text)
    if diet:
        prefs["dietTypes"] = [diet]

    lower = text.lower()
    allergens = []
    for allergen in ALLERGENS:
        if (
            f"free of {allergen}" in lower
            or f"without {allergen}" in lower
            or f"no {allergen}" in lower
            or f"{allergen}-free" in lower
        ):
            allergens.append(allergen)
    if "مكسرات" in lower:
        allergens.append("nuts")
    if "البان" in lower or "ألبان" in text:
        allergens.append("dairy")
    if allergens:
        prefs["allergens"] = sorted(set(allergens))

    max_price = _extract_price_hint(text)
    if max_price:
        prefs["maxPrice"] = max_price
    if any(word in lower for word in ["light", "healthy", "low calorie", "low-calorie", "خفيف", "صحي"]):
        prefs["wantsLight"] = True
    return prefs


def _extract_serving_size(text: str) -> Optional[int]:
    match = re.search(r"\b(1|2|4|6)\s*(?:people|person|servings?|افراد|أفراد|اشخاص|أشخاص)?\b", text.lower())
    return int(match.group(1)) if match else None


def _extract_frequency(text: str) -> Optional[str]:
    lower = text.lower()
    if "weekly" in lower or "اسبوع" in lower or "أسبوع" in text:
        return "weekly"
    if "monthly" in lower or "شهري" in lower:
        return "monthly"
    return None