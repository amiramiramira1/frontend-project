from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from groq import Groq
from dotenv import load_dotenv
from pymongo import MongoClient
import os, json, re, time

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client["boxify"]
    client.admin.command('ping')
    print("✅ Connected to MongoDB")
except Exception as e:
    print(f"❌ MongoDB error: {e}")
    db = None

_cache = {"boxes": [], "meals": [], "prompt_text": "", "last_updated": 0}
CACHE_TTL = 300

def get_cached_data():
    now = time.time()
    if now - _cache["last_updated"] > CACHE_TTL or not _cache["prompt_text"]:
        _cache["boxes"]        = _fetch_boxes()
        _cache["meals"]        = _fetch_meals()
        _cache["prompt_text"]  = _build_prompt_text(_cache["boxes"], _cache["meals"])
        _cache["last_updated"] = now
        print(f"🔄 Cache refresh — {len(_cache['boxes'])} boxes, {len(_cache['meals'])} meals")
        if _cache["boxes"]:
            print("📦 Boxes found:", [b.get('name') for b in _cache["boxes"]])
        else:
            print("⚠️ No boxes found in DB!")
        if _cache["meals"]:
            print("🍽️ Meals found:", [m.get('name') for m in _cache["meals"]])
        else:
            print("⚠️ No meals found in DB!")
    return _cache["boxes"], _cache["meals"], _cache["prompt_text"]

def _fetch_boxes():
    try:
        if db is None:  # ✅ FIX
            print("❌ DB is None")
            return []
        count = db.boxes.count_documents({})
        print(f"📦 Total boxes in DB: {count}")
        boxes = list(db.boxes.find({}, {
            "_id":1,"name":1,"description":1,"dietType":1,"basePrice":1,"isActive":1
        }))
        for b in boxes:
            b["_id"] = str(b["_id"])
        print(f"📦 Fetched {len(boxes)} boxes")
        return boxes
    except Exception as e:
        print(f"❌ fetch_boxes error: {e}")
        return []

def _fetch_meals():
    try:
        if db is None:  # ✅ FIX
            print("❌ DB is None")
            return []
        count = db.meals.count_documents({})
        print(f"🍽️ Total meals in DB: {count}")
        meals = list(db.meals.find({}, {
            "_id":1,"name":1,"description":1,"dietType":1,
            "pricePerServing":1,"caloriesPerServing":1,"allergens":1
        }))
        for m in meals:
            m["_id"] = str(m["_id"])
        print(f"🍽️ Fetched {len(meals)} meals")
        return meals
    except Exception as e:
        print(f"❌ fetch_meals error: {e}")
        return []

def _build_prompt_text(boxes, meals):
    if not boxes and not meals:
        return "No data available in database."
    text = "=== BOXES ===\n"
    for b in boxes:
        text += f"- {b.get('name','')} | diet: {b.get('dietType','')} | price: {b.get('basePrice',0)} EGP"
        if b.get('description'): text += f" | {b['description']}"
        text += "\n"
    text += "\n=== MEALS ===\n"
    for m in meals:
        allergens = ', '.join(m.get('allergens', [])) if m.get('allergens') else 'none'
        text += (f"- {m.get('name','')} | diet: {m.get('dietType','')} "
                 f"| {m.get('pricePerServing',0)} EGP/serving "
                 f"| {m.get('caloriesPerServing',0)} cal "
                 f"| allergens: {allergens}\n")
    return text

def clean_response(text: str) -> str:
    cleaned = re.sub(
        r'[^\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF'
        r'a-zA-Z0-9\s\n\.,!?؟،؛:\-\(\)\[\]\'\"\/'
        r'🍱🤖🥗🥩🐟🍗🥚🥑🎉✅⚠️💪⚖️😊😅🛒🔄📦🍽️💰👥🎯●✨#*]',
        '', text
    )
    return cleaned.strip()

def call_groq(system_prompt: str, user_message: str, max_tokens: int = 400) -> str:
    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_message}
        ],
        max_tokens=max_tokens,
        temperature=0.7
    )
    return response.choices[0].message.content or ""

sessions: dict = {}

def get_session(session_id: str, language: str = "ar") -> dict:
    key = f"{session_id}_{language}"
    if key not in sessions:
        sessions[key] = {"language": language, "history": []}
    return sessions[key]

dataset: list = []
dataset_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'dataset.json')
if os.path.exists(dataset_path):
    with open(dataset_path, 'r', encoding='utf-8') as f:
        dataset = json.load(f)
    print(f"✅ Dataset loaded: {len(dataset)} items")
else:
    print("⚠️ dataset.json not found")

def find_in_dataset(question: str, language: str = "ar") -> Optional[str]:
    q = question.lower().strip()
    if len(q) < 4: return None
    for item in dataset:
        en = (item.get('question_en') or '').lower()
        ar = (item.get('question_ar') or '').lower()
        if q in en or en in q or q in ar or ar in q:
            answer = (item.get('answer_ar') if language != 'en'
                      else (item.get('answer') or item.get('answer_ar')))
            val = str(answer or '').strip()
            if val and val != 'nan': return val
    return None

class ChatRequest(BaseModel):
    message:    str
    session_id: Optional[str] = Field(default="default", alias="sessionId")
    language:   Optional[str] = "ar"
    model_config = {"populate_by_name": True}

class RecommendationRequest(BaseModel):
    diet:      Optional[str] = ""
    goal:      Optional[str] = ""
    people:    Optional[str] = ""
    budget:    Optional[str] = ""
    allergies: Optional[str] = ""
    language:  Optional[str] = "ar"
    mode:      Optional[str] = "boxes"

@app.get("/")
def root():
    return {"message": "Boxify AI is running 🍱"}

@app.get("/boxes")
def get_boxes():
    boxes, _, _ = get_cached_data()
    return {"boxes": boxes}

@app.get("/meals")
def get_meals():
    _, meals, _ = get_cached_data()
    return {"meals": meals}

@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        dataset_answer = find_in_dataset(req.message, req.language)
        if dataset_answer:
            return {"answer": dataset_answer, "source": "dataset"}

        _, _, prompt_text = get_cached_data()
        sid  = req.session_id or "default"
        lang = req.language or "ar"
        session = get_session(sid, lang)

        if "No data available" in prompt_text:
            if lang == "en":
                return {"answer": "Sorry, our menu data is currently unavailable. Please try again later! 😅", "source": "error"}
            return {"answer": "معلش، بياناتنا مش متاحة دلوقتي. حاولي تاني بعدين! 😅", "source": "error"}

        history_text = ""
        for h in session["history"][-6:]:
            if lang == "en":
                history_text += f"User: {h['user']}\nAssistant: {h['assistant']}\n\n"
            else:
                history_text += f"العميل: {h['user']}\nالمساعد: {h['assistant']}\n\n"

        if lang == "en":
            system = f"""You are a helpful assistant for Boxify, an Egyptian meal kit delivery service.

BOXIFY DATA (use ONLY these items, never invent names):
{prompt_text}

RULES:
- Reply in English only, max 3-4 sentences
- ONLY recommend boxes and meals that exist EXACTLY in the data above
- Never invent box or meal names
- Be friendly and direct
- If question is not about Boxify or food, say you only help with Boxify"""
            user_msg = f"{history_text}User: {req.message}\nAssistant:"
        else:
            system = f"""أنت مساعد ذكي لـ Boxify، موقع مصري لتوصيل أكل صحي طازج.

بيانات Boxify (استخدم بس الحاجات دي، متخترعش أسماء):
{prompt_text}

قواعد مهمة جداً:
- رد بالعربي المصري بس، مختصر ومباشر (3-4 جمل)
- اقترح بس بوكسات ووجبات موجودة في البيانات فوق بالاسم بالظبط
- متخترعش أي اسم بوكس أو وجبة مش موجود في البيانات
- كن ودود"""
            user_msg = f"{history_text}العميل: {req.message}\nالمساعد:"

        answer = clean_response(call_groq(system, user_msg))
        if not answer:
            raise ValueError("empty response")

        session["history"].append({"user": req.message, "assistant": answer})
        return {"answer": answer, "source": "groq"}

    except Exception as e:
        print(f"Chat error: {e}")
        if (req.language or "ar") == "en":
            return {"answer": "Sorry, something went wrong. Please try again! 😅", "source": "error"}
        return {"answer": "معلش حصلت مشكلة صغيرة، ممكن تعيد السؤال؟ 😅", "source": "error"}

@app.post("/recommend")
async def recommend(req: RecommendationRequest):
    try:
        _, _, prompt_text = get_cached_data()
        lang = req.language or "ar"

        if "No data available" in prompt_text:
            if lang == "en":
                return {"recommendation": "Sorry, menu data is unavailable right now. Please try again later! 😅", "source": "error"}
            return {"recommendation": "معلش، بياناتنا مش متاحة دلوقتي. حاولي تاني بعدين! 😅", "source": "error"}

        if req.mode == "build":
            if lang == "en":
                system = f"""You are a Boxify meal planner.
AVAILABLE MEALS (use ONLY these exact names, never invent):
{prompt_text}

Rules:
- Suggest 3-5 meals using EXACT names from the list only
- Format each line: meal name — reason — price
- End with total estimated price
- English only, be concise"""
                user_msg = (f"Suggest meals: diet={req.diet or 'any'}, goal={req.goal or 'general'}, "
                            f"people={req.people or '2'}, budget={req.budget or 'medium'}, "
                            f"allergies={req.allergies or 'none'}")
            else:
                system = f"""أنت مخطط وجبات Boxify.
الوجبات المتاحة فقط (استخدم الأسماء بالظبط، لا تخترع):
{prompt_text}

قواعد مهمة:
- اقترح 3-5 وجبات من القائمة بس بالاسم بالظبط كما هو مكتوب
- كل سطر: اسم الوجبة — سبب قصير — السعر
- في الآخر وضح السعر الإجمالي التقريبي
- عربي مصري بس، مختصر"""
                user_msg = (f"اقترح وجبات: نوع={req.diet or 'أي'}, هدف={req.goal or 'عام'}, "
                            f"أشخاص={req.people or '2'}, ميزانية={req.budget or 'متوسطة'}, "
                            f"حساسيات={req.allergies or 'مفيش'}")
        else:
            if lang == "en":
                system = f"""You are a Boxify assistant.
AVAILABLE BOXES (use ONLY these exact names, never invent):
{prompt_text}

Rules:
- Recommend exactly ONE box using its EXACT name from the list
- Format:
  ✅ Box: [exact name from list]
  Why: [1-2 sentences]
  Includes meals like: [examples from data only]
  Price: [from data]
- English only"""
                user_msg = (f"Recommend a box: diet={req.diet or 'any'}, goal={req.goal or 'general'}, "
                            f"people={req.people or '2'}, budget={req.budget or 'medium'}, "
                            f"allergies={req.allergies or 'none'}")
            else:
                system = f"""أنت مساعد Boxify.
البوكسات المتاحة فقط (استخدم الأسماء بالظبط، لا تخترع أي اسم):
{prompt_text}

قواعد مهمة جداً:
- اقترح بوكس واحد بالظبط موجود في القائمة فوق
- استخدم اسم البوكس بالظبط كما هو مكتوب في القائمة
- متخترعش أي اسم مش موجود في القائمة
- الشكل:
  ✅ البوكس: [الاسم بالظبط من القائمة]
  ليه: [جملة أو جملتين]
  فيه وجبات زي: [أمثلة من البيانات بس]
  السعر: [من البيانات]
- عربي مصري بس"""
                user_msg = (f"اقترح بوكس: نوع={req.diet or 'أي'}, هدف={req.goal or 'عام'}, "
                            f"أشخاص={req.people or '2'}, ميزانية={req.budget or 'متوسطة'}, "
                            f"حساسيات={req.allergies or 'مفيش'}")

        result = clean_response(call_groq(system, user_msg, max_tokens=450))
        if not result:
            raise ValueError("empty response")
        return {"recommendation": result, "source": "groq"}

    except Exception as e:
        print(f"Recommendation error: {e}")
        if (req.language or "ar") == "en":
            return {"recommendation": "Sorry, couldn't get a recommendation. Please try again! 😅", "source": "error"}
        return {"recommendation": "معلش مقدرناش نوصلك باقتراح، حاولي تاني 😅", "source": "error"}

@app.delete("/session/{session_id}")
async def clear_session(session_id: str):
    keys_to_delete = [k for k in sessions if k.startswith(session_id)]
    for k in keys_to_delete: del sessions[k]
    return {"message": "تم مسح المحادثة"}