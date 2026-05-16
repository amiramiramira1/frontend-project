// Recommendation.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShoppingCart } from 'lucide-react';

const dietStyles = {
  vegetarian: { color: 'bg-green-100 text-green-700',    label: '🌱 Vegetarian' },
  vegan:      { color: 'bg-emerald-100 text-emerald-700', label: '🌿 Vegan' },
  keto:       { color: 'bg-purple-100 text-purple-700',  label: '⚡ Keto' },
  paleo:      { color: 'bg-amber-100 text-amber-700',    label: '🥩 Paleo' },
  standard:   { color: 'bg-blue-100 text-blue-700',      label: '🍽️ Standard' },
  mixed:      { color: 'bg-gray-100 text-gray-700',      label: '🔀 Mixed' },
};
const MULTIPLIERS = { 1: 1, 2: 1.8, 4: 3.2, 6: 4.5 };

const getQuestions = (lang) => [
  {
    id: 'diet',
    question: lang === 'en' ? '🍽️ What food do you prefer?' : '🍽️ بتفضل إيه؟',
    options: lang === 'en'
      ? [{ label: '🍗 Chicken', value: 'chicken' }, { label: '🐟 Fish', value: 'fish' }, { label: '🥩 Beef', value: 'beef' }, { label: '🥗 Vegetarian', value: 'vegetarian' }]
      : [{ label: '🍗 دجاج', value: 'دجاج' }, { label: '🐟 سمك', value: 'سمك' }, { label: '🥩 لحمة', value: 'لحمة' }, { label: '🥗 نباتي', value: 'نباتي' }],
  },
  {
    id: 'allergies',
    question: lang === 'en' ? '⚠️ Any allergies?' : '⚠️ عندك حساسية؟',
    options: lang === 'en'
      ? [{ label: '✅ None', value: 'none' }, { label: '🥛 Dairy', value: 'dairy' }, { label: '🌾 Gluten', value: 'gluten' }, { label: '🥜 Nuts', value: 'nuts' }]
      : [{ label: '✅ مفيش', value: 'مفيش' }, { label: '🥛 لاكتوز', value: 'لاكتوز' }, { label: '🌾 جلوتين', value: 'جلوتين' }, { label: '🥜 مكسرات', value: 'مكسرات' }],
  },
  {
    id: 'goal',
    question: lang === 'en' ? '🎯 Health goal?' : '🎯 هدفك الصحي؟',
    options: lang === 'en'
      ? [{ label: '⚖️ Weight loss', value: 'weight loss' }, { label: '💪 Muscle', value: 'muscle building' }, { label: '🥦 Healthy eating', value: 'healthy eating' }, { label: '😋 Just eat well', value: 'variety' }]
      : [{ label: '⚖️ تخسيس', value: 'تخسيس' }, { label: '💪 عضلات', value: 'بناء عضلات' }, { label: '🥦 صحي', value: 'أكل صحي' }, { label: '😋 أكل كويس', value: 'متنوع' }],
  },
  {
    id: 'people',
    question: lang === 'en' ? '👥 How many people?' : '👥 لكام شخص؟',
    options: [{ label: '👤 1', value: '1' }, { label: '👫 2', value: '2' }, { label: '👨‍👩‍👧‍👦 4', value: '4' }, { label: '🏠 6', value: '6' }],
  },
  {
    id: 'budget',
    question: lang === 'en' ? '💰 Budget?' : '💰 ميزانيتك؟',
    options: lang === 'en'
      ? [{ label: '💚 Under 200 EGP', value: 'under 200 EGP' }, { label: '💛 200–400 EGP', value: '200 to 400 EGP' }, { label: '🧡 400+ EGP', value: 'over 400 EGP' }]
      : [{ label: '💚 أقل من 200', value: 'أقل من 200 جنيه' }, { label: '💛 200–400 جنيه', value: '200 إلى 400 جنيه' }, { label: '🧡 أكتر من 400', value: 'أكتر من 400 جنيه' }],
  },
];

export default function Recommendation({ onClose, mode = 'boxes', onMealsSelected }) {
  const navigate = useNavigate();

  const [language,     setLanguage]     = useState(null);
  const [current,      setCurrent]      = useState(0);
  const [answers,      setAnswers]      = useState({});
  const [loading,      setLoading]      = useState(false);
  const [showResult,   setShowResult]   = useState(false);
  const [resultText,   setResultText]   = useState('');
  const [matchedBox,   setMatchedBox]   = useState(null);
  const [matchedMeals, setMatchedMeals] = useState([]);
  const [allBoxes,     setAllBoxes]     = useState([]);
  const [allMeals,     setAllMeals]     = useState([]);
  const [error,        setError]        = useState('');

  const questions = language ? getQuestions(language) : [];

  useEffect(() => {
    fetch('http://localhost:8000/boxes').then(r => r.json()).then(d => setAllBoxes(d.boxes || [])).catch(() => {});
    fetch('http://localhost:8000/meals').then(r => r.json()).then(d => setAllMeals(d.meals || [])).catch(() => {});
  }, []);

  function matchBox(text) {
    if (!allBoxes.length) return null;
    for (const box of allBoxes) {
      if (text.toLowerCase().includes(box.name.toLowerCase())) return box;
    }
    return allBoxes[0];
  }

  function matchMeals(text) {
    if (!allMeals.length) return [];
    return allMeals.filter(m => text.toLowerCase().includes(m.name.toLowerCase()));
  }

  async function handleAnswer(id, value) {
    const newAnswers = { ...answers, [id]: value };
    setAnswers(newAnswers);
    if (current < questions.length - 1) { setCurrent(prev => prev + 1); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/chatbot/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diet: newAnswers.diet || '', goal: newAnswers.goal || '',
          people: newAnswers.people || '', budget: newAnswers.budget || '',
          allergies: newAnswers.allergies || '', language, mode,
        }),
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      const text = data.recommendation || data.answer || '';
      if (!text.trim()) throw new Error('Empty response');
      setResultText(text);
      if (mode === 'boxes') setMatchedBox(matchBox(text));
      else setMatchedMeals(matchMeals(text));
    } catch {
      setError(language === 'en' ? 'Could not get a recommendation. Please try again!' : 'معلش مقدرناش نوصلك باقتراح، حاولي تاني!');
    } finally {
      setLoading(false);
      setShowResult(true);
    }
  }

  function handleGoToBox() {
    onClose();
    navigate(matchedBox?._id ? `/boxes/${matchedBox._id}` : '/boxes');
  }

  // ── FIX: بنروح لـ BuildBox مع الوجبات المقترحة ──────────────────
  function handleGoToBuildBox() {
  // ── FIX: بنحفظ الوجبات في localStorage قبل ما نروح للصفحة ──
  if (matchedMeals.length > 0) {
    localStorage.setItem(
      'pending_recommended_meals',
      JSON.stringify(matchedMeals.map(m => m._id))
    );
  }
  onClose();
  navigate('/build-box');
}

  function handleRestart() {
    setCurrent(0); setAnswers({}); setShowResult(false);
    setResultText(''); setMatchedBox(null); setMatchedMeals([]); setError(''); setLanguage(null);
  }

  const isRtl = language === 'ar';

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: '420px', height: '100vh',
      backgroundColor: '#fff', boxShadow: '-4px 0 32px rgba(0,0,0,0.15)',
      zIndex: 1000, display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, Arial, sans-serif', direction: isRtl ? 'rtl' : 'ltr',
    }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1b5e20, #43a047)', padding: '18px 20px',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>🤖</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {mode === 'build' ? (language === 'en' ? 'Build My Box AI' : 'ابني بوكسك الذكي') : (language === 'en' ? 'Box Recommender' : 'اقتراح البوكس')}
            </div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>
              {language === 'en' ? 'Powered by AI · Read-only' : 'مدعوم بالذكاء الاصطناعي · للقراءة فقط'}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
          borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>

        {/* اختيار اللغة */}
        {!language && (
          <div style={{ textAlign: 'center', paddingTop: 20 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🌍</div>
            <h3 style={{ color: '#1b5e20', marginBottom: 6, fontSize: 18 }}>Choose your language</h3>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 28 }}>اختار لغتك</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {['en', 'ar'].map(lang => (
                <button key={lang} onClick={() => setLanguage(lang)} style={{
                  padding: '13px 28px', borderRadius: 12, border: '2px solid #43a047',
                  backgroundColor: '#fff', fontSize: 15, cursor: 'pointer',
                  fontWeight: 700, color: '#1b5e20', transition: 'background 0.2s',
                }}
                  onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f1f8e9'; }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = '#fff'; }}
                >
                  {lang === 'en' ? '🇬🇧 English' : '🇪🇬 عربي'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* الأسئلة */}
        {language && !showResult && !loading && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#999' }}>
                  {language === 'en' ? `Step ${current + 1} of ${questions.length}` : `خطوة ${current + 1} من ${questions.length}`}
                </span>
                <span style={{ fontSize: 12, color: '#43a047', fontWeight: 700 }}>
                  {Math.round(((current + 1) / questions.length) * 100)}%
                </span>
              </div>
              <div style={{ width: '100%', height: 6, backgroundColor: '#e8f5e9', borderRadius: 3 }}>
                <div style={{
                  width: `${((current + 1) / questions.length) * 100}%`, height: '100%',
                  background: 'linear-gradient(90deg, #1b5e20, #43a047)', borderRadius: 3, transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
            <h3 style={{ fontSize: 17, color: '#1a1a1a', marginBottom: 16 }}>{questions[current].question}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {questions[current].options.map(opt => (
                <button key={opt.value} onClick={() => handleAnswer(questions[current].id, opt.value)} style={{
                  padding: '12px 16px', borderRadius: 12, border: '2px solid #e8f5e9',
                  backgroundColor: '#fff', fontSize: 14, cursor: 'pointer',
                  textAlign: isRtl ? 'right' : 'left', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center',
                  color: '#1a1a1a', transition: 'all 0.18s',
                }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#43a047'; e.currentTarget.style.backgroundColor = '#f1f8e9'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#e8f5e9'; e.currentTarget.style.backgroundColor = '#fff'; }}
                >
                  <span>{opt.label}</span>
                  <span style={{ color: '#43a047', fontSize: 12 }}>›</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🤖</div>
            <p style={{ color: '#43a047', fontSize: 16, marginBottom: 8 }}>
              {language === 'en' ? (mode === 'build' ? 'Selecting best meals…' : 'Finding your perfect box…') : (mode === 'build' ? 'بيختار أحسن وجبات ليك…' : 'بيفكر في أحسن بوكس ليك…')}
            </p>
            <p style={{ fontSize: 22, letterSpacing: 8, color: '#43a047' }}>●●●</p>
          </div>
        )}

        {/* النتيجة */}
        {showResult && !loading && (
          <>
            {error ? (
              <div style={{ textAlign: 'center', paddingTop: 20 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>😅</div>
                <div style={{ backgroundColor: '#fff3f3', borderRadius: 12, padding: 16, color: '#c62828', marginBottom: 16, fontSize: 14, lineHeight: 1.6 }}>{error}</div>
                <button onClick={handleRestart} className="btn-primary w-full">
                  {language === 'en' ? 'Try again 🔄' : 'حاولي تاني 🔄'}
                </button>
              </div>

            ) : mode === 'boxes' ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 40 }}>🎉</span>
                  <h3 style={{ color: '#1b5e20', margin: '8px 0 4px', fontSize: 17 }}>
                    {language === 'en' ? 'Perfect box for you!' : 'البوكس المثالي ليك!'}
                  </h3>
                </div>
                {matchedBox && (
                  <div style={{ border: '2px solid #43a047', borderRadius: 16, overflow: 'hidden', marginBottom: 16, boxShadow: '0 4px 16px rgba(67,160,71,0.15)' }}>
                    <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                      <img src={matchedBox.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600'} alt={matchedBox.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '14px 16px' }}>
                      <h4 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: '#1a1a1a' }}>{matchedBox.name}</h4>
                      <p style={{ fontSize: 13, color: '#666', marginBottom: 10, lineHeight: 1.5 }}>{matchedBox.description}</p>
                      {matchedBox.basePrice && (
                        <div style={{ marginBottom: 14 }}>
                          <span style={{ fontWeight: 700, color: '#f79408', fontSize: 15 }}>
                            from {(matchedBox.basePrice * MULTIPLIERS[2]).toFixed(0)} EGP
                          </span>
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button onClick={handleGoToBox} className="btn-primary w-full flex items-center justify-center gap-2">
                          <ShoppingCart size={16} />
                          {language === 'en' ? 'View Box & Order' : 'شوف البوكس واطلبه'}
                        </button>
                        <button onClick={handleRestart} style={{ padding: '10px 16px', borderRadius: 10, border: '2px solid #43a047', backgroundColor: '#fff', color: '#1b5e20', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
                          {language === 'en' ? '🔄 Try another' : '🔄 جرب تاني'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ backgroundColor: '#f1f8e9', borderRadius: 12, padding: 14, fontSize: 13, color: '#2e7d32', lineHeight: 1.7, whiteSpace: 'pre-wrap', direction: isRtl ? 'rtl' : 'ltr' }}>
                  {resultText}
                </div>
              </div>

            ) : (
              /* ── BuildBoxPage result ── */
              <div>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 40 }}>✨</span>
                  <h3 style={{ color: '#1b5e20', margin: '8px 0 4px', fontSize: 17 }}>
                    {language === 'en' ? 'Suggested meals for you' : 'الوجبات المقترحة ليك'}
                  </h3>
                  <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
                    {language === 'en' ? 'You can modify anytime — AI only suggests!' : 'تقدر تعدل في أي وقت — الـ AI بس بيقترح!'}
                  </p>
                </div>

                {matchedMeals.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {matchedMeals.map(meal => (
                      <div key={meal._id} style={{ display: 'flex', gap: 10, alignItems: 'center', backgroundColor: '#f1f8e9', borderRadius: 10, padding: 10, border: '1.5px solid #a5d6a7' }}>
                        <span style={{ fontSize: 22 }}>🍽️</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>{meal.name}</div>
                          <div style={{ fontSize: 11, color: '#666' }}>{meal.pricePerServing} EGP · {meal.caloriesPerServing} cal</div>
                        </div>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, backgroundColor: '#c8e6c9', color: '#1b5e20', fontWeight: 600 }}>✅</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ backgroundColor: '#f1f8e9', borderRadius: 12, padding: 14, fontSize: 13, color: '#2e7d32', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 14, direction: isRtl ? 'rtl' : 'ltr' }}>
                  {resultText}
                </div>

                <div style={{ backgroundColor: '#fff8e1', borderRadius: 10, padding: 12, fontSize: 12, color: '#f57f17', marginBottom: 14 }}>
                  ⚠️ {language === 'en' ? 'AI suggestions only — you have full control to add or remove meals!' : 'الـ AI بس بيقترح — انتي عندك التحكم الكامل في إضافة أو شيل الوجبات!'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* ── FIX: زرار يودي لـ BuildBox مع الوجبات ── */}
                  <button onClick={handleGoToBuildBox} style={{
                    padding: '13px 16px', borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg, #1b5e20, #43a047)',
                    color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    <Sparkles size={16} />
                    {language === 'en' ? '🛒 Build my box with these meals' : '🛒 ابني بوكسي بالوجبات دي'}
                  </button>
                  <button onClick={handleRestart} style={{ padding: '10px 16px', borderRadius: 10, border: '2px solid #43a047', backgroundColor: '#fff', color: '#1b5e20', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
                    {language === 'en' ? '🔄 Try again' : '🔄 ابدأ تاني'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}