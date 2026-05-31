// Chatbot.jsx — Boxify Chef 🥕
// AI chatbot with Gemini function calling, rich message rendering, and auth-aware flows
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const API_BASE = '/api/chatbot';

export default function Chatbot() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => 'session_' + Math.random().toString(36).substr(2, 9));
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-initialize chatbot language to website language when chat opens
  const webLang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  useEffect(() => {
    if (isOpen && !language) {
      selectLanguage(webLang);
    }
  }, [isOpen, language, webLang]);

  useEffect(() => {
    if (isOpen && language && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, language]);

  function selectLanguage(lang) {
    setLanguage(lang);
    const welcome = lang === 'en'
      ? "Hey! 👋 I'm Boxify Chef 🥕\nI can help you find the perfect meal box, build a custom one, or answer any questions about Boxify!\n\nWhat would you like to do?"
      : "أهلاً! 👋 أنا Boxify Chef 🥕\nأقدر أساعدك تلاقي بوكس مناسب ليك، تبني بوكس مخصص، أو أجاوب على أي سؤال عن Boxify!\n\nتحب نعمل إيه؟";

    const quickActions = lang === 'en'
      ? [
          { text: '📦 Recommend a box', action: 'I want a box recommendation' },
          { text: '🛠️ Build my own box', action: 'I want to build my own custom box' },
          { text: '❓ Ask a question', action: null },
        ]
      : [
          { text: '📦 اقترح بوكس', action: 'عايز اقتراح لبوكس' },
          { text: '🛠️ ابني بوكسي', action: 'عايز أبني بوكس مخصص' },
          { text: '❓ اسأل سؤال', action: null },
        ];

    setMessages([{ from: 'bot', text: welcome, quickActions }]);
  }

  async function sendMessage(overrideMessage = null) {
    const userMessage = overrideMessage || input.trim();
    if (!userMessage || loading) return;
    if (!overrideMessage) setInput('');

    // Auto-detect language of the user message to keep UI layout and language consistent
    const promptLang = /[\u0600-\u06FF]/.test(userMessage) ? 'ar' : 'en';
    if (promptLang !== language) {
      setLanguage(promptLang);
    }

    setMessages(prev => [...prev, { from: 'user', text: userMessage }]);
    setLoading(true);

    try {
      // Get token from localStorage
      const token = localStorage.getItem('boxify_token');

      const res = await fetch(API_BASE + '/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
          language,
          userToken: token || null,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const answerText = data.answer || '';
      const toolCalls = data.toolCalls || [];

      // Parse tool results for rich rendering
      const richData = parseToolResults(toolCalls);

      setMessages(prev => [...prev, {
        from: 'bot',
        text: answerText,
        ...richData,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        from: 'bot',
        text: language === 'en'
          ? 'Sorry, something went wrong. Please try again! 😅'
          : 'معلش حصلت مشكلة، ممكن تعيد السؤال؟ 😅',
      }]);
    } finally {
      setLoading(false);
    }
  }

  function parseToolResults(toolCalls) {
    const result = {};
    for (const tc of toolCalls) {
      if (tc.tool === 'recommend_box' && tc.result?.boxes) {
        result.boxes = tc.result.boxes;
      }
      if (tc.tool === 'get_available_meals' && tc.result?.meals) {
        result.meals = tc.result.meals;
      }
      if (tc.tool === 'add_to_cart' && tc.result?.success) {
        result.cartAdded = true;
        result.cartTotal = tc.result.cartTotal;
      }
      if (tc.tool === 'create_custom_box' && tc.result?.success) {
        result.boxCreated = { id: tc.result.boxId, name: tc.result.name, price: tc.result.price };
      }
      if (tc.tool === 'create_subscription' && tc.result?.success) {
        result.subscriptionCreated = true;
      }
    }
    return result;
  }

  async function clearChat() {
    setLanguage(null);
    setMessages([]);
    try {
      await fetch(`${API_BASE}/session/${sessionId}`, { method: 'DELETE' });
    } catch { /* ignore */ }
  }

  function handleQuickAction(action) {
    if (action) sendMessage(action);
  }

  // ── Render helpers ──────────────────────────────────────────────────────

  function renderBoxCards(boxes) {
    return (
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 0', marginTop: '8px' }}>
        {boxes.map((box, i) => (
          <div key={i} style={{
            minWidth: '200px', background: '#fff', borderRadius: '12px',
            border: '1px solid #e8e8e8', padding: '12px', flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#1b5e20', marginBottom: '4px' }}>
              {box.name}
            </div>
            {box.dietType && (
              <span style={{
                display: 'inline-block', fontSize: '10px', padding: '2px 8px',
                borderRadius: '10px', background: '#e8f5e9', color: '#2e7d32',
                marginBottom: '6px', fontWeight: 600,
              }}>
                {box.dietType}
              </span>
            )}
            {box.description && (
              <p style={{ fontSize: '11px', color: '#666', margin: '4px 0', lineHeight: 1.3 }}>
                {box.description.substring(0, 60)}...
              </p>
            )}
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#333', margin: '6px 0' }}>
              {box.price} EGP
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              <button
                onClick={() => { setIsOpen(false); navigate(`/boxes/${box.id}`); }}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: '8px', border: '1.5px solid #43a047',
                  background: '#fff', color: '#1b5e20', fontSize: '11px', cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                {language === 'en' ? 'View' : 'شوف'}
              </button>
              <button
                onClick={() => sendMessage(
                  language === 'en'
                    ? `Add the "${box.name}" box to my cart with serving size 2`
                    : `ضيف بوكس "${box.name}" للسلة بحجم تقديم 2`
                )}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #1b5e20, #43a047)',
                  color: '#fff', fontSize: '11px', cursor: 'pointer', fontWeight: 700,
                }}
              >
                🛒 {language === 'en' ? 'Add' : 'أضف'}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderMealList(meals) {
    return (
      <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto' }}>
        {meals.slice(0, 8).map((meal, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 10px', borderRadius: '8px', background: i % 2 === 0 ? '#f9fafb' : '#fff',
            fontSize: '12px', marginBottom: '2px',
          }}>
            <div>
              <span style={{ fontWeight: 600, color: '#333' }}>{meal.name}</span>
              {meal.allergens?.length > 0 && (
                <span style={{ fontSize: '10px', color: '#ef5350', marginLeft: '6px' }}>
                  ⚠️ {meal.allergens.join(', ')}
                </span>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
              <div style={{ fontWeight: 700, color: '#1b5e20' }}>{meal.price} EGP</div>
              <div style={{ fontSize: '10px', color: '#999' }}>{meal.calories} cal</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderCartConfirmation(cartTotal) {
    return (
      <div style={{
        marginTop: '8px', background: '#e8f5e9', borderRadius: '10px',
        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ fontSize: '20px' }}>✅</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#1b5e20' }}>
            {language === 'en' ? 'Added to cart!' : 'تمت الإضافة للسلة!'}
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            {language === 'en' ? `Cart total: ${cartTotal} EGP` : `إجمالي السلة: ${cartTotal} جنيه`}
          </div>
        </div>
        <button
          onClick={() => { setIsOpen(false); navigate('/cart'); }}
          style={{
            marginLeft: 'auto', padding: '6px 12px', borderRadius: '8px',
            background: '#1b5e20', color: '#fff', border: 'none',
            fontSize: '11px', cursor: 'pointer', fontWeight: 700,
          }}
        >
          🛒 {language === 'en' ? 'Go to Cart' : 'روح للسلة'}
        </button>
      </div>
    );
  }

  function renderSubscriptionConfirmation() {
    return (
      <div style={{
        marginTop: '8px', background: '#fff3e0', borderRadius: '10px',
        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ fontSize: '20px' }}>🎉</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#e65100' }}>
            {language === 'en' ? 'Subscription created!' : 'تم إنشاء الاشتراك!'}
          </div>
        </div>
        <button
          onClick={() => { setIsOpen(false); navigate('/dashboard/subscriptions'); }}
          style={{
            marginLeft: 'auto', padding: '6px 12px', borderRadius: '8px',
            background: '#e65100', color: '#fff', border: 'none',
            fontSize: '11px', cursor: 'pointer', fontWeight: 700,
          }}
        >
          {language === 'en' ? 'View Subs' : 'شوف الاشتراكات'}
        </button>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
      {/* Floating button with carrot mascot */}
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff9800, #f57c00)',
          color: 'white', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(255,152,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s',
          overflow: 'hidden', padding: 0,
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(255,152,0,0.5)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,152,0,0.4)';
        }}
      >
        {isOpen ? (
          <span style={{ fontSize: '22px', fontWeight: 'bold' }}>✕</span>
        ) : (
          <img src="/carrot-chef.png" alt="Chef" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '50%' }} />
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div style={{
          position: 'absolute', bottom: '72px', right: '0',
          width: '380px', height: '540px',
          background: '#fff', borderRadius: '20px',
          boxShadow: '0 10px 50px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          fontFamily: 'Inter, system-ui, sans-serif',
          animation: 'chatSlideUp 0.3s ease',
        }}>
          <style>{`
            @keyframes chatSlideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
            @keyframes dotPulse { 0%,100% { opacity:.3; transform:scale(.75); } 50% { opacity:1; transform:scale(1); } }
            .chat-scrollbar::-webkit-scrollbar { width: 4px; }
            .chat-scrollbar::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
          `}</style>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #ff9800, #f57c00)',
            color: 'white', padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/carrot-chef.png" alt="Chef" style={{
                width: '36px', height: '36px', borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.4)', objectFit: 'cover',
              }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>Boxify Chef</div>
                <div style={{ fontSize: '11px', opacity: 0.85 }}>● Online</div>
              </div>
            </div>
            <button
              onClick={clearChat}
              style={{
                background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '14px',
                transition: 'background 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              title={language === 'en' ? 'New chat' : 'محادثة جديدة'}
            >
              🔄
            </button>
          </div>

          {/* Language selection */}
          {!language ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '24px', background: '#fffaf0',
            }}>
              <img src="/carrot-chef.png" alt="Chef" style={{
                width: '80px', height: '80px', marginBottom: '14px', borderRadius: '50%',
                boxShadow: '0 4px 16px rgba(255,152,0,0.2)',
              }} />
              <p style={{ textAlign: 'center', color: '#333', margin: '0 0 6px', fontSize: '15px', fontWeight: 'bold' }}>
                Choose your language
              </p>
              <p style={{ color: '#888', fontSize: '13px', margin: '0 0 24px' }}>
                اختار لغتك
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['en', 'ar'].map(l => (
                  <button
                    key={l}
                    onClick={() => selectLanguage(l)}
                    style={{
                      padding: '12px 24px', borderRadius: '12px',
                      border: '2px solid #ff9800', background: '#fff',
                      fontSize: '14px', cursor: 'pointer', fontWeight: 'bold',
                      color: '#e65100', transition: 'all 0.2s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#fff3e0'; e.currentTarget.style.transform = 'scale(1.03)'; }}
                    onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {l === 'en' ? '🇬🇧 English' : '🇪🇬 عربي'}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="chat-scrollbar" style={{
                flex: 1, overflowY: 'auto', padding: '14px',
                display: 'flex', flexDirection: 'column', gap: '10px',
                background: '#fefefe',
              }}>
                {messages.map((msg, i) => (
                  <div key={i}>
                    <div style={{
                      display: 'flex',
                      justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                      alignItems: 'flex-end', gap: '8px',
                    }}>
                      {msg.from === 'bot' && (
                        <img src="/carrot-chef.png" alt="" style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          flexShrink: 0, marginBottom: '2px',
                        }} />
                      )}
                      <div style={{
                        background: msg.from === 'user'
                          ? 'linear-gradient(135deg, #ff9800, #f57c00)'
                          : '#fff',
                        color: msg.from === 'user' ? '#fff' : '#333',
                        padding: '10px 14px',
                        borderRadius: msg.from === 'user'
                          ? '18px 18px 4px 18px'
                          : '18px 18px 18px 4px',
                        maxWidth: '78%', fontSize: '13.5px', lineHeight: 1.6,
                        direction: language === 'ar' ? 'rtl' : 'ltr',
                        whiteSpace: 'pre-wrap',
                        boxShadow: msg.from === 'user'
                          ? '0 2px 8px rgba(255,152,0,0.2)'
                          : '0 1px 4px rgba(0,0,0,0.06)',
                        border: msg.from === 'bot' ? '1px solid #f0f0f0' : 'none',
                      }}>
                        {msg.text}
                      </div>
                    </div>

                    {/* Rich content: box cards */}
                    {msg.from === 'bot' && msg.boxes && msg.boxes.length > 0 && (
                      <div style={{ marginLeft: '32px' }}>
                        {renderBoxCards(msg.boxes)}
                      </div>
                    )}

                    {/* Rich content: meal list */}
                    {msg.from === 'bot' && msg.meals && msg.meals.length > 0 && (
                      <div style={{ marginLeft: '32px' }}>
                        {renderMealList(msg.meals)}
                      </div>
                    )}

                    {/* Rich content: cart confirmation */}
                    {msg.from === 'bot' && msg.cartAdded && (
                      <div style={{ marginLeft: '32px' }}>
                        {renderCartConfirmation(msg.cartTotal)}
                      </div>
                    )}

                    {/* Rich content: subscription confirmation */}
                    {msg.from === 'bot' && msg.subscriptionCreated && (
                      <div style={{ marginLeft: '32px' }}>
                        {renderSubscriptionConfirmation()}
                      </div>
                    )}

                    {/* Quick action buttons */}
                    {msg.from === 'bot' && msg.quickActions && (
                      <div style={{ marginLeft: '32px', display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {msg.quickActions.map((qa, j) => (
                          <button
                            key={j}
                            onClick={() => qa.action ? handleQuickAction(qa.action) : inputRef.current?.focus()}
                            style={{
                              padding: '7px 14px', borderRadius: '20px',
                              border: '1.5px solid #ff9800', background: '#fff',
                              color: '#e65100', fontSize: '12px', cursor: 'pointer',
                              fontWeight: 600, transition: 'all 0.2s',
                              whiteSpace: 'nowrap',
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = '#fff3e0'; }}
                            onMouseOut={e => { e.currentTarget.style.background = '#fff'; }}
                          >
                            {qa.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading dots */}
                {loading && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <img src="/carrot-chef.png" alt="" style={{
                      width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                    }} />
                    <div style={{
                      background: '#fff', padding: '12px 16px',
                      borderRadius: '18px 18px 18px 4px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      border: '1px solid #f0f0f0',
                      display: 'flex', gap: '5px', alignItems: 'center',
                    }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: '7px', height: '7px', borderRadius: '50%',
                          background: '#ff9800',
                          animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Login prompt for guests trying actions */}
                {!user && messages.length > 0 && (
                  <div style={{
                    textAlign: 'center', padding: '8px', marginTop: '4px',
                  }}>
                    <p style={{ fontSize: '11px', color: '#999', margin: '0 0 4px' }}>
                      {language === 'en'
                        ? 'Sign in for personalized recommendations and to build custom boxes'
                        : 'سجل دخول عشان نقدر نقترحلك بوكسات ونبنيلك بوكس مخصص'}
                    </p>
                    <button
                      onClick={() => { setIsOpen(false); navigate('/login'); }}
                      style={{
                        padding: '5px 14px', borderRadius: '12px', border: 'none',
                        background: '#ff9800', color: '#fff', fontSize: '11px',
                        cursor: 'pointer', fontWeight: 600,
                      }}
                    >
                      {language === 'en' ? 'Sign In' : 'سجل دخول'}
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{
                padding: '10px 12px', borderTop: '1px solid #f0f0f0',
                display: 'flex', gap: '8px', background: '#fff', flexShrink: 0,
              }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={language === 'en' ? 'Type your message...' : 'اكتب سؤالك هنا...'}
                  disabled={loading}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: '20px',
                    border: '1.5px solid #e0e0e0', outline: 'none',
                    direction: language === 'ar' ? 'rtl' : 'ltr',
                    fontSize: '13.5px', background: loading ? '#fafafa' : '#fff',
                    transition: 'border-color 0.2s',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#ff9800'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e0e0e0'}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: loading || !input.trim()
                      ? '#e0e0e0'
                      : 'linear-gradient(135deg, #ff9800, #f57c00)',
                    color: '#fff', border: 'none',
                    cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.2s',
                    boxShadow: loading || !input.trim() ? 'none' : '0 2px 8px rgba(255,152,0,0.3)',
                  }}
                >
                  ➤
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}