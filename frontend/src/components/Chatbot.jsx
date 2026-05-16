// Chatbot.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SESSION_ID = 'user_' + Math.random().toString(36).substr(2, 9);

// ── بنجيب البوكسات مرة واحدة عند أول تحميل ──────────────────────────────────
let cachedBoxes = [];
fetch('http://localhost:8000/boxes').then(r => r.json()).then(d => { cachedBoxes = d.boxes || []; }).catch(() => {});

// ── بندور على اسم بوكس في النص ───────────────────────────────────────────────
function findBoxInText(text) {
  if (!cachedBoxes.length) return null;
  for (const box of cachedBoxes) {
    if (text.toLowerCase().includes(box.name.toLowerCase())) return box;
  }
  return null;
}

export default function Chatbot() {
  const navigate = useNavigate();
  const [isOpen,    setIsOpen]    = useState(false);
  const [language,  setLanguage]  = useState(null);
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function selectLanguage(lang) {
    setLanguage(lang);
    const welcome = lang === 'en'
      ? "Hey! 👋 I'm your Boxify assistant 🤖\nI'll help you find the perfect meal box. What would you like to know?"
      : "أهلاً! 👋 أنا مساعدك في Boxify 🤖\nهساعدك تلاقي البوكس المثالي ليك! إيه اللي تحب تعرفه؟";
    setMessages([{ from: 'bot', text: welcome }]);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { from: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, sessionId: SESSION_ID, language }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const answerText = data.answer || '';

      // ── FIX: بندور على بوكس في الرد ───────────────────────────────
      const foundBox = findBoxInText(answerText);

      setMessages(prev => [...prev, {
        from: 'bot',
        text: answerText,
        box: foundBox || null,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        from: 'bot',
        text: language === 'en' ? 'Sorry, something went wrong. Please try again! 😅' : 'معلش حصلت مشكلة، ممكن تعيد السؤال؟ 😅',
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function clearChat() {
    setLanguage(null);
    setMessages([]);
    try { await fetch(`http://localhost:5000/api/chatbot/session/${SESSION_ID}`, { method: 'DELETE' }); } catch {}
  }

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
      <button onClick={() => setIsOpen(o => !o)} style={{
        width: '60px', height: '60px', borderRadius: '50%', background: '#2e7d32',
        color: 'white', border: 'none', fontSize: '28px', cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s, box-shadow 0.2s',
      }}
        onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'; }}
        onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)'; }}
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', bottom: '72px', right: '0', width: '360px', height: '520px',
          background: '#fff', borderRadius: '20px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          fontFamily: 'system-ui, Arial, sans-serif',
        }}>
          {/* Header */}
          <div style={{ background: '#2e7d32', color: 'white', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '26px' }}>🤖</span>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Boxify Assistant</div>
                <div style={{ fontSize: '11px', opacity: 0.85 }}>● Online</div>
              </div>
            </div>
            <button onClick={clearChat} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '14px' }}>🔄</button>
          </div>

          {/* اختيار اللغة */}
          {!language ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#f9fafb' }}>
              <span style={{ fontSize: '48px', marginBottom: '14px' }}>🤖</span>
              <p style={{ textAlign: 'center', color: '#333', margin: '0 0 6px', fontSize: '15px', fontWeight: 'bold' }}>Choose your language</p>
              <p style={{ color: '#888', fontSize: '13px', margin: '0 0 24px' }}>اختار لغتك</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['en', 'ar'].map(l => (
                  <button key={l} onClick={() => selectLanguage(l)} style={{ padding: '12px 22px', borderRadius: '12px', border: '2px solid #43a047', background: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold', color: '#1b5e20' }}
                    onMouseOver={e => e.currentTarget.style.background = '#e8f5e9'}
                    onMouseOut={e => e.currentTarget.style.background = '#fff'}
                  >
                    {l === 'en' ? '🇬🇧 English' : '🇪🇬 عربي'}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* الرسائل */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#f9fafb' }}>
                {messages.map((msg, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px' }}>
                      {msg.from === 'bot' && <span style={{ fontSize: '20px', marginBottom: '2px', flexShrink: 0 }}>🤖</span>}
                      <div style={{
                        background: msg.from === 'user' ? '#2e7d32' : '#fff',
                        color: msg.from === 'user' ? '#fff' : '#111',
                        padding: '10px 14px',
                        borderRadius: msg.from === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        maxWidth: '78%', fontSize: '14px', lineHeight: 1.6,
                        direction: language === 'ar' ? 'rtl' : 'ltr',
                        whiteSpace: 'pre-wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      }}>
                        {msg.text}
                      </div>
                    </div>

                    {/* ── FIX: زرار البوكس لو الـ AI اقترح بوكس ── */}
                    {msg.from === 'bot' && msg.box && (
                      <div style={{ marginTop: 8, marginRight: 32, display: 'flex', gap: 6, flexDirection: 'column' }}>
                        <button
                          onClick={() => { setIsOpen(false); navigate(`/boxes/${msg.box._id}`); }}
                          style={{
                            padding: '9px 14px', borderRadius: 10, border: 'none',
                            background: 'linear-gradient(135deg, #1b5e20, #43a047)',
                            color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content',
                          }}
                        >
                          🛒 {language === 'en' ? `View "${msg.box.name}"` : `شوف "${msg.box.name}"`}
                        </button>
                        <button
                          onClick={() => { setIsOpen(false); navigate('/build-box'); }}
                          style={{
                            padding: '9px 14px', borderRadius: 10,
                            border: '2px solid #43a047', background: '#fff',
                            color: '#1b5e20', fontSize: 12, cursor: 'pointer', fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content',
                          }}
                        >
                          ✨ {language === 'en' ? 'Build my own box' : 'ابني بوكسي بنفسي'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>🤖</span>
                    <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '18px 18px 18px 4px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', gap: '5px', alignItems: 'center' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#43a047', animation: `dp 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                      <style>{`@keyframes dp{0%,100%{opacity:.3;transform:scale(.75)}50%{opacity:1;transform:scale(1)}}`}</style>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '10px 12px', borderTop: '1px solid #eee', display: 'flex', gap: '8px', background: '#fff', flexShrink: 0 }}>
                <input type="text" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={language === 'en' ? 'Type your message...' : 'اكتب سؤالك هنا...'}
                  disabled={loading}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1.5px solid #ddd', outline: 'none', direction: language === 'ar' ? 'rtl' : 'ltr', fontSize: '14px', background: loading ? '#f5f5f5' : '#fff' }}
                />
                <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: loading || !input.trim() ? '#ccc' : '#2e7d32',
                  color: '#fff', border: 'none',
                  cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 0.2s',
                }}>➤</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}