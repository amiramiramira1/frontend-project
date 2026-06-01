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
from google import genai
from google.genai import types
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime, timedelta
import os, json, httpx, time, sys, re, difflib

# Reconfigure stdout/stderr to UTF-8 to prevent UnicodeEncodeError on Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(title="Boxify AI Service", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# GEMINI CLIENT
# ─────────────────────────────────────────────────────────────────────────────

gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_ID = "gemini-2.5-flash-lite"

# ─────────────────────────────────────────────────────────────────────────────
# MONGODB (for sessions + FAQ data)
# ─────────────────────────────────────────────────────────────────────────────

MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")

try:
    mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = mongo_client["boxify"]
    mongo_client.admin.command('ping')
    print("✅ Connected to MongoDB")

    # Create TTL index on chat_sessions — auto-delete after 7 days
    db.chat_sessions.create_index("expiresAt", expireAfterSeconds=0)
except Exception as e:
    print(f"❌ MongoDB error: {e}")
    db = None

# ─────────────────────────────────────────────────────────────────────────────
# FAQ DATASET
# ─────────────────────────────────────────────────────────────────────────────

dataset: list = []
dataset_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'dataset.json')

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
    # Pre-normalize dataset questions for blazing-fast search
    for item in dataset:
        item['question_en_norm'] = normalize_text(item.get('question_en') or '', 'en')
        item['question_ar_norm'] = normalize_text(item.get('question_ar') or '', 'ar')
    print("✅ FAQ dataset pre-normalized")
else:
    print("⚠️ dataset.json not found")


def search_faq(query: str, language: str = "ar") -> Optional[str]:
    """Search the FAQ dataset for matching answers using a two-stage fuzzy matching algorithm."""
    q = query.strip()
    if len(q) < 3:
        return None
        
    q_norm = normalize_text(query, language)
    q_words = set(q_norm.split())
    
    # Stage 1: Candidate pre-filtering (Fast word overlap & containment check)
    candidates = []
    for item in dataset:
        # Lazy/dynamic pre-normalization to support test suite dataset patching
        if 'question_en_norm' not in item:
            item['question_en_norm'] = normalize_text(item.get('question_en') or '', 'en')
        if 'question_ar_norm' not in item:
            item['question_ar_norm'] = normalize_text(item.get('question_ar') or '', 'ar')
            
        target_norm = item['question_ar_norm'] if language != 'en' else item['question_en_norm']
        other_norm = item['question_en_norm'] if language != 'en' else item['question_ar_norm']
        
        score = 0
        for qw in q_words:
            if len(qw) >= 2:
                if qw in target_norm:
                    score += 3
                elif qw in other_norm:
                    score += 1.5
                    
        len_diff = abs(len(q_norm) - len(target_norm))
        candidates.append((item, score, target_norm, other_norm, len_diff))
        
    # Sort candidates by overlap score descending, then length difference ascending
    candidates.sort(key=lambda x: (-x[1], x[4]))
    top_candidates = candidates[:50]
    
    # Stage 2: Heavy fuzzy scoring (SequenceMatcher, substring bonus, sorted ratios)
    best_match = None
    best_score = 0
    threshold = 10.0
    
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
            
        # Word-order robust ratio
        sorted_q = " ".join(sorted(q_norm.split()))
        sorted_target = " ".join(sorted(target_norm.split()))
        sorted_ratio = difflib.SequenceMatcher(None, sorted_q, sorted_target).ratio()
        total_score += sorted_ratio * 4
        
        if total_score > best_score:
            answer = (item.get('answer_ar') if language != 'en'
                      else (item.get('answer') or item.get('answer_ar')))
            val = str(answer or '').strip()
            if val and val != 'nan':
                best_score = total_score
                best_match = val
                
    return best_match if best_score >= threshold else None

# ─────────────────────────────────────────────────────────────────────────────
# TOOL DEFINITIONS (Gemini Function Declarations)
# ─────────────────────────────────────────────────────────────────────────────

TOOL_DECLARATIONS = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="search_faq",
            description="Search the Boxify FAQ/knowledge base for answers about policies, delivery, subscriptions, payment, cancellations, serving sizes, and other business questions.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "query": types.Schema(type="STRING", description="The user's question about Boxify")
                },
                required=["query"]
            )
        ),
        types.FunctionDeclaration(
            name="recommend_box",
            description="Find pre-made boxes matching user preferences. Returns box cards with name, price, diet type, and image. Use when user wants a box recommendation.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "dietType": types.Schema(type="STRING", description="Diet type filter: vegan, vegetarian, keto, paleo, standard"),
                    "maxPrice": types.Schema(type="NUMBER", description="Maximum price in EGP"),
                },
            )
        ),
        types.FunctionDeclaration(
            name="get_available_meals",
            description="List meals available for building a custom box. Use when user wants to build their own box or see available meals.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "dietType": types.Schema(type="STRING", description="Filter by diet type: vegan, vegetarian, keto, paleo, standard"),
                },
            )
        ),
        types.FunctionDeclaration(
            name="create_custom_box",
            description="Create a custom box from selected meal IDs. Call ONLY after the user has reviewed and confirmed their meal selection, serving size, and whether they want one-time or subscription.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "mealIds": types.Schema(type="ARRAY", items=types.Schema(type="STRING"), description="Array of meal ID strings"),
                    "name": types.Schema(type="STRING", description="Optional custom name for the box"),
                },
                required=["mealIds"]
            )
        ),
        types.FunctionDeclaration(
            name="add_to_cart",
            description="Add a box to the user's shopping cart. Use after recommending a box or creating a custom box, when the user confirms they want it.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "boxId": types.Schema(type="STRING", description="The box ID to add"),
                    "servingSize": types.Schema(type="NUMBER", description="Serving size: 1, 2, 4, or 6"),
                    "quantity": types.Schema(type="NUMBER", description="Number of boxes to add, default 1"),
                },
                required=["boxId", "servingSize"]
            )
        ),
        types.FunctionDeclaration(
            name="create_subscription",
            description="Create a recurring subscription for a box. Use when user explicitly wants a subscription (weekly or monthly delivery).",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "boxId": types.Schema(type="STRING", description="The box ID to subscribe to"),
                    "servingSize": types.Schema(type="NUMBER", description="Serving size: 1, 2, 4, or 6"),
                    "frequency": types.Schema(type="STRING", description="Delivery frequency: weekly or monthly"),
                },
                required=["boxId", "servingSize", "frequency"]
            )
        ),
    ]
)

# ─────────────────────────────────────────────────────────────────────────────
# TOOL EXECUTION
# ─────────────────────────────────────────────────────────────────────────────

async def execute_tool(tool_name: str, args: dict, user_token: str = None, language: str = "ar") -> dict:
    """Execute a tool call by either searching locally or calling the Node.js API."""

    if tool_name == "search_faq":
        result = search_faq(args.get("query", ""), language)
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
                # Simplify the response for Gemini
                boxes = data.get("boxes", [])
                return {
                    "boxes": [
                        {
                            "id": b.get("_id"),
                            "name": b.get("name"),
                            "description": b.get("description", ""),
                            "dietType": b.get("dietType"),
                            "price": b.get("priceForServing") or b.get("basePrice"),
                            "image": b.get("image", ""),
                            "meals": [m.get("name") for m in (b.get("meals") or [])],
                        }
                        for b in boxes[:6]
                    ],
                    "count": len(boxes),
                }

            elif tool_name == "get_available_meals":
                # Fetch meals directly from MongoDB for speed
                if db is not None:
                    query_filter = {}
                    if args.get("dietType"):
                        query_filter["dietType"] = args["dietType"].lower().strip()
                    meals = list(db.meals.find(query_filter, {
                        "_id": 1, "name": 1, "description": 1, "dietType": 1,
                        "pricePerServing": 1, "caloriesPerServing": 1, "allergens": 1
                    }))
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

def get_session_history(session_id: str) -> list:
    """Retrieve conversation history from MongoDB."""
    if db is None:
        return []
    session = db.chat_sessions.find_one({"sessionId": session_id})
    if not session:
        return []
    return session.get("messages", [])


def save_session_message(session_id: str, role: str, content: str, user_id: str = None,
                         tool_call: dict = None, tool_result: dict = None):
    """Append a message to the session in MongoDB."""
    if db is None:
        return

    message = {
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow(),
    }
    if tool_call:
        message["toolCall"] = tool_call
    if tool_result:
        message["toolResult"] = tool_result

    db.chat_sessions.update_one(
        {"sessionId": session_id},
        {
            "$push": {"messages": message},
            "$set": {
                "updatedAt": datetime.utcnow(),
                "expiresAt": datetime.utcnow() + timedelta(days=7),
            },
            "$setOnInsert": {
                "sessionId": session_id,
                "userId": user_id,
                "createdAt": datetime.utcnow(),
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
1. **FAQ**: Answer questions about Boxify policies, delivery, subscriptions, payment, etc. Use the search_faq tool first.
2. **Recommend Boxes**: Suggest existing pre-made boxes based on user preferences using recommend_box tool.
3. **Build Custom Box**: Guide users through creating a custom meal box:
   - Ask about diet preferences and allergies
   - Show available meals using get_available_meals tool
   - Let them pick meals
   - Ask about serving size (1, 2, 4, or 6 people)
   - Ask if they want one-time purchase or subscription (weekly/monthly)
   - Create the box using create_custom_box, then add to cart with add_to_cart
   - If subscription, also call create_subscription

IMPORTANT RULES:
- Be warm, friendly, and concise (2-4 sentences per response)
- When recommending boxes or meals, present them clearly with names and prices
- NEVER invent box or meal names — only use data from tools
- When user wants to add something to cart, always confirm the serving size first
- For build-a-box flow, guide step by step — don't rush
- If user is not logged in and tries to use cart/box features, tell them to sign in first
- If question is not about food or Boxify, politely say you can only help with Boxify
- When presenting boxes from recommend_box results, include the box ID so the frontend can render cards
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
    # `language` kept for backwards-compatibility but is now ignored —
    # language is auto-detected from the message text.
    language:   Optional[str] = Field(default=None, exclude=True)
    model_config = {"populate_by_name": True}

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

        # Auto-detect language from the user's message
        lang = detect_language(req.message)

        # Build conversation history from MongoDB
        history = get_session_history(sid)

        # Convert history to Gemini message format
        gemini_history = []
        for msg in history[-10:]:  # Keep last 10 messages for context
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "user":
                gemini_history.append(types.Content(role="user", parts=[types.Part.from_text(text=content)]))
            elif role == "model":
                gemini_history.append(types.Content(role="model", parts=[types.Part.from_text(text=content)]))

        # Single unified prompt — Gemini mirrors the user's language automatically
        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            tools=[TOOL_DECLARATIONS],
            temperature=0.7,
            max_output_tokens=800,
        )

        # Save user message to session
        save_session_message(sid, "user", req.message)

        # Add the new user message
        gemini_history.append(types.Content(role="user", parts=[types.Part.from_text(text=req.message)]))

        # ReAct loop: keep calling Gemini until we get a text response
        max_iterations = 5
        tool_calls_made = []

        for iteration in range(max_iterations):
            response = gemini_client.models.generate_content(
                model=MODEL_ID,
                contents=gemini_history,
                config=config,
            )

            candidate = response.candidates[0]
            parts = candidate.content.parts

            # Check if there are function calls in the response
            function_calls = [p for p in parts if p.function_call]

            if not function_calls:
                # No function calls — we have a text response
                text_parts = [p.text for p in parts if p.text]
                answer = " ".join(text_parts).strip()

                if not answer:
                    answer = "Sorry, I couldn't process that. Could you rephrase?"

                # Save assistant response
                save_session_message(sid, "model", answer)

                return {
                    "answer": answer,
                    "source": "gemini",
                    "toolCalls": tool_calls_made,
                }

            # Process function calls
            # Add the model's response (with function calls) to history
            gemini_history.append(candidate.content)

            # Execute each function call and build response parts
            function_response_parts = []
            for part in function_calls:
                fc = part.function_call
                tool_name = fc.name
                tool_args = dict(fc.args) if fc.args else {}

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
                save_session_message(sid, "tool", json.dumps(result, default=str),
                                     tool_call={"name": tool_name, "args": tool_args})

                # Build function response part
                function_response_parts.append(
                    types.Part.from_function_response(
                        name=tool_name,
                        response=result,
                    )
                )

            # Add function results back to conversation
            gemini_history.append(types.Content(role="user", parts=function_response_parts))

        # If we hit max iterations, return a neutral fallback
        return {
            "answer": "I'm having trouble processing your request. Could you try again?",
            "source": "error",
            "toolCalls": tool_calls_made,
        }

    except Exception as e:
        print(f"❌ Chat error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "answer": "Sorry, something went wrong. Please try again! 😅",
            "source": "error",
        }


@app.delete("/session/{session_id}")
async def clear_session(session_id: str):
    """Clear a chat session's history."""
    if db is not None:
        db.chat_sessions.delete_one({"sessionId": session_id})
    return {"message": "Session cleared"}