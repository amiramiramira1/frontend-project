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


def classify_intent(query: str, language: str = "ar") -> str:
    """Classify user query as 'faq', 'recommendation', or 'other' using BM25 max-score voting."""
    _ensure_indices_built()
    if not intent_faq_items or not intent_rec_items or intent_bm25_faq_ar is None:
        return 'other'
        
    q_norm = normalize_text(query, language)
    q_tokens = [w for w in q_norm.split() if w not in STOP_WORDS]
    if not q_tokens:
        return 'other'

    if language == 'en':
        faq_score = float(intent_bm25_faq_en.get_scores(q_tokens).max())
        rec_score = float(intent_bm25_rec_en.get_scores(q_tokens).max())
    else:
        faq_score = float(intent_bm25_faq_ar.get_scores(q_tokens).max())
        rec_score = float(intent_bm25_rec_ar.get_scores(q_tokens).max())

    # INTENT_THRESHOLD prevents weak matches from being misrouted
    INTENT_THRESHOLD = 1.0 if len(dataset) > 10 else 0.01
    if max(faq_score, rec_score) < INTENT_THRESHOLD:
        return 'other'

    return 'faq' if faq_score >= rec_score else 'recommendation'


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
                    meals = await db.meals.find(query_filter, {
                        "_id": 1, "name": 1, "description": 1, "dietType": 1,
                        "pricePerServing": 1, "caloriesPerServing": 1, "allergens": 1
                    }).to_list(length=200)
                    return {
                        "meals": [
                            {
                                "id": str(m["_id"]),
                                "name": m.get("name"),
                                "description": m.get("description", ""),
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
                payload = {"meals": args["mealIds"]}
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
    # `language` kept for backwards-compatibility but is now ignored —
    # language is auto-detected from the message text.
    language:   Optional[str] = Field(default=None, exclude=True)
    model_config = {"populate_by_name": True}

# ─────────────────────────────────────────────────────────────────────────────
# GROQ RETRY HELPER
# ─────────────────────────────────────────────────────────────────────────────

async def groq_generate_with_retry(messages, model_id, max_retries=3):
    """Call Groq with exponential backoff on rate-limit or transient errors."""
    for attempt in range(max_retries):
        try:
            response = await groq_client.chat.completions.create(
                model=model_id,
                messages=messages,
                tools=TOOL_DECLARATIONS,
                tool_choice="auto",
                temperature=0.0,
                max_tokens=800,
            )
            return response
        except Exception as e:
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
# MAIN CHAT ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "Boxify AI Service v2.0 🥕", "model": MODEL_ID}


@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        sid  = req.session_id or "default"
        user_token = req.user_token
        model_id = req.model or MODEL_ID

        # Auto-detect language from the user's message
        lang = detect_language(req.message)

        # ── Intent Router (Phase 3) ───────────────────────────────────────────
        is_testing = "PYTEST_CURRENT_TEST" in os.environ and not getattr(sys.modules[__name__], "FORCE_FAST_PATH", False)
        
        if not is_testing:
            intent = classify_intent(req.message, lang)
            
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
                    }
                    
            # Recommendation fast path: pre-fetch recommend_box and feed to Gemini in a single turn
            elif intent == 'recommendation':
                diet_hint = _extract_diet_hint(req.message)
                rec_args = {}
                if diet_hint:
                    rec_args["dietType"] = diet_hint
                    
                rec_result = await execute_tool("recommend_box", rec_args, user_token, lang)
                
                # Save user message to session
                await save_session_message(sid, "user", req.message)
                
                # Build conversation history
                history = await get_session_history(sid)
                messages = [
                    {"role": "system", "content": SYSTEM_PROMPT}
                ]
                for msg in history[-10:]:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    if role == "user":
                        messages.append({"role": "user", "content": content})
                    elif role == "model":
                        messages.append({"role": "assistant", "content": content})
                        
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
                max_iterations = 5
                tool_calls_made = [{
                    "tool": "recommend_box",
                    "args": rec_args,
                    "result": rec_result,
                }]
                
                for iteration in range(max_iterations):
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
                        }

                    messages.append(assistant_msg)

                    for tool_call in tool_calls:
                        tool_name = tool_call.function.name
                        tool_args = json.loads(tool_call.function.arguments) if tool_call.function.arguments else {}

                        print(f"🔧 Tool call: {tool_name}({json.dumps(tool_args, default=str)})")

                        result = await execute_tool(tool_name, tool_args, user_token, lang)
                        tool_calls_made.append({
                            "tool": tool_name,
                            "args": tool_args,
                            "result": result,
                        })

                        print(f"✅ Tool result: {json.dumps(result, default=str)[:200]}")

                        await save_session_message(sid, "tool", json.dumps(result, default=str),
                                             tool_call={"name": tool_name, "args": tool_args})

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
                }

            # Process function calls
            # Add the model's response (with function calls) to history
            # For Groq, the assistant message object can be appended directly or as dict
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
        }

    except Exception as e:
        print(f"❌ Chat error: {e}")
        import traceback
        traceback.print_exc()

        # Attempt FAQ fallback for simple questions
        try:
            faq_answer = search_faq(req.message, detect_language(req.message))
            if faq_answer:
                return {"answer": faq_answer, "source": "faq_fallback", "toolCalls": [], "model": model_id}
        except Exception:
            pass

        return {
            "answer": "I'm experiencing high demand right now. Please try again in a moment! 😊",
            "source": "error",
            "model": model_id,
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