// Chatbot.jsx — Boxify Chef 🥕
// AI chatbot with deterministic build-a-box flow, rich message rendering, and
// auth-aware flows. Responsive (full-screen on mobile), resizable on desktop,
// with persistence across reloads.
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';

const API_BASE = '/api/chatbot';
const STORE_KEY = 'boxify_chat';
const SIZE_KEY = 'boxify_chat_size';
const DEFAULT_SIZE = { width: 400, height: 600 };
const MIN_SIZE = { width: 320, height: 440 };

function loadPersisted() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch { return null; }
}
function loadSize() {
  try {
    const s = JSON.parse(localStorage.getItem(SIZE_KEY) || 'null');
    if (s && s.width && s.height) return s;
  } catch { /* ignore */ }
  return DEFAULT_SIZE;
}
function newSessionId() {
  return 'session_' + Math.random().toString(36).slice(2, 11);
}

export default function Chatbot() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchCart } = useCart();
  const { i18n } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState(() => loadPersisted()?.language ?? null);
  const [messages, setMessages] = useState(() => loadPersisted()?.messages ?? []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeFlow, setActiveFlow] = useState(() => loadPersisted()?.activeFlow ?? null);
  const [pendingFlow, setPendingFlow] = useState(null);
  const [sessionId, setSessionId] = useState(() => loadPersisted()?.sessionId || newSessionId());

  // Responsive + window-size state
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  const [size, setSize] = useState(loadSize);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const nearBottomRef = useRef(true);
  const resizingRef = useRef(null);

  // ── Persistence ─────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ language, messages, activeFlow, sessionId }));
    } catch { /* quota / private mode — ignore */ }
  }, [language, messages, activeFlow, sessionId]);

  useEffect(() => {
    try { localStorage.setItem(SIZE_KEY, JSON.stringify(size)); } catch { /* ignore */ }
  }, [size]);

  // ── Responsive listener ───────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ── Smart auto-scroll (only follow if the user is already near the bottom) ──
  useEffect(() => {
    if (nearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  function onMessagesScroll() {
    const el = messagesContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    nearBottomRef.current = nearBottom;
    setShowScrollBtn(!nearBottom);
  }
  function scrollToBottom() {
    nearBottomRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBtn(false);
  }

  // Auto-initialize chatbot language to the website language when chat opens
  const webLang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  useEffect(() => {
    if (isOpen && !language) selectLanguage(webLang);
  }, [isOpen, language, webLang]);

  useEffect(() => {
    if (isOpen && language && inputRef.current && !isMobile) inputRef.current.focus();
  }, [isOpen, language, isMobile]);

  // ── Desktop resize (drag the top-left grip) ───────────────────────────────
  const onResizing = useCallback((e) => {
    const r = resizingRef.current;
    if (!r) return;
    const maxW = window.innerWidth - 48;
    const maxH = window.innerHeight - 120;
    const w = Math.min(Math.max(MIN_SIZE.width, r.startW + (r.startX - e.clientX)), maxW);
    const h = Math.min(Math.max(MIN_SIZE.height, r.startH + (r.startY - e.clientY)), maxH);
    setSize({ width: Math.round(w), height: Math.round(h) });
  }, []);
  const onResizeEnd = useCallback(() => {
    resizingRef.current = null;
    window.removeEventListener('pointermove', onResizing);
    window.removeEventListener('pointerup', onResizeEnd);
    document.body.style.userSelect = '';
  }, [onResizing]);
  function onResizeStart(e) {
    e.preventDefault();
    resizingRef.current = { startX: e.clientX, startY: e.clientY, startW: size.width, startH: size.height };
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onResizing);
    window.addEventListener('pointerup', onResizeEnd);
  }

  function fmtTime(ts) {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return ''; }
  }

  function selectLanguage(lang) {
    setLanguage(lang);
    const welcome = lang === 'en'
      ? "Hey! 👋 I'm Boxify Chef 🥕\nI can help you find the perfect meal box, build a custom one, or answer any questions about Boxify!\n\nWhat would you like to do?"
      : "أهلاً! 👋 أنا Boxify Chef 🥕\nأقدر أساعدك تلاقي بوكس مناسب ليك، تبني بوكس مخصص، أو أجاوب على أي سؤال عن Boxify!\n\nتحب نعمل إيه؟";

    const quickActions = lang === 'en'
      ? [
          { text: '📦 Recommend a box', send: { message: 'I want a box recommendation', flow: 'recommendation' } },
          { text: '🛠️ Build my own box', send: { message: '', flow: 'custom_box', action: { type: 'start' } } },
          { text: '❓ Ask a question', focus: true, pendingFlow: 'faq' },
        ]
      : [
          { text: '📦 اقترح بوكس', send: { message: 'عايز اقتراح لبوكس', flow: 'recommendation' } },
          { text: '🛠️ ابني بوكسي', send: { message: '', flow: 'custom_box', action: { type: 'start' } } },
          { text: '❓ اسأل سؤال', focus: true, pendingFlow: 'faq' },
        ];

    setMessages([{ from: 'bot', text: welcome, quickActions, time: Date.now() }]);
  }

  // sendMessage supports both free-typed messages and structured flow actions.
  // opts: { flow, action } — `flow` locks a deterministic flow (e.g. 'custom_box');
  // `action` is a structured UI action (e.g. { type: 'add_meal', mealId }).
  async function sendMessage(overrideMessage = null, opts = {}) {
    const { flow, action } = opts;
    const isTyped = overrideMessage === null;
    const userMessage = isTyped ? input.trim() : (overrideMessage || '');
    if (loading) return;
    if (!userMessage && !action) return; // nothing to send
    if (isTyped) setInput('');

    // Resolve which flow this turn belongs to: explicit > one-shot hint > active lock
    const effectiveFlow = flow || pendingFlow || activeFlow || null;
    if (pendingFlow) setPendingFlow(null);

    // Auto-detect language only for real typed text
    if (userMessage) {
      const promptLang = /[؀-ۿ]/.test(userMessage) ? 'ar' : 'en';
      if (promptLang !== language) setLanguage(promptLang);
    }

    // A new send means the user wants to follow along — snap to bottom
    nearBottomRef.current = true;

    // Only show a user bubble for real text (not for silent button actions)
    if (userMessage) {
      setMessages(prev => [...prev, { from: 'user', text: userMessage, time: Date.now() }]);
    }
    setLoading(true);

    try {
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
          flow: effectiveFlow,
          action: action || null,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const answerText = data.answer || '';

      // Track the locked flow returned by the server (null once the flow ends)
      setActiveFlow(data.flow || null);

      // Parse tool results (cart/box/subscription confirmations) + build-flow UI data
      const richData = {
        ...parseToolResults(data.toolCalls || []),
        ...(data.selectableMeals ? { selectableMeals: data.selectableMeals } : {}),
        ...(data.selection ? { selection: data.selection } : {}),
        ...(data.priceInfo ? { priceInfo: data.priceInfo } : {}),
        ...(data.quickActions ? { quickActions: data.quickActions } : {}),
        ...(data.flowState ? { flowState: data.flowState } : {}),
      };

      const isBuildBox = data.source === 'build_box';
      const botMsg = {
        from: 'bot',
        text: answerText,
        time: Date.now(),
        // Mark the live build-box card while the flow is active so we update it in place
        ...(isBuildBox ? { isBuildBox: data.flow === 'custom_box' } : {}),
        ...richData,
      };

      // The build-a-box flow lives in ONE message that morphs through its steps
      // (meals → serving → purchase → confirm → result) instead of appending a
      // new bubble on every Add/step. Replace the live card if one exists.
      setMessages(prev => {
        if (isBuildBox) {
          for (let k = prev.length - 1; k >= 0; k--) {
            if (prev[k].from === 'bot' && prev[k].isBuildBox) {
              const copy = [...prev];
              copy[k] = botMsg;
              return copy;
            }
          }
        }
        return [...prev, botMsg];
      });

      // Keep the cart UI (navbar badge + cart page) in sync after the bot adds to it
      if (richData.cartAdded) fetchCart();
    } catch {
      setMessages(prev => [...prev, {
        from: 'bot',
        time: Date.now(),
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
    const oldSession = sessionId;
    setLanguage(null);
    setMessages([]);
    setActiveFlow(null);
    setPendingFlow(null);
    setSessionId(newSessionId());
    try { localStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
    try { await fetch(`${API_BASE}/session/${oldSession}`, { method: 'DELETE' }); } catch { /* ignore */ }
  }

  // Unified quick-action dispatcher. A quick action can either:
  //  - { focus: true }                       → focus the input (and arm a flow hint)
  //  - { send: { message, flow, action } }   → send a free-typed/flow message
  //  - { action: {…} }                       → server build-flow chip (structured)
  //  - { action: 'text' }                    → legacy: send the text as a message
  function dispatchQuickAction(qa) {
    if (!qa) return;
    if (qa.focus) {
      if (qa.pendingFlow) setPendingFlow(qa.pendingFlow);
      inputRef.current?.focus();
      return;
    }
    if (qa.send) {
      sendMessage(qa.send.message ?? '', { flow: qa.send.flow, action: qa.send.action });
      return;
    }
    if (qa.action && typeof qa.action === 'object') {
      sendMessage('', { flow: 'custom_box', action: qa.action });
      return;
    }
    if (typeof qa.action === 'string') {
      sendMessage(qa.action);
      return;
    }
    inputRef.current?.focus();
  }

  // Convenience helpers for the interactive build-a-box meal list
  function addMeal(mealId) {
    sendMessage('', { flow: 'custom_box', action: { type: 'add_meal', mealId } });
  }
  function changeMealQty(mealId, delta) {
    sendMessage('', { flow: 'custom_box', action: { type: 'change_qty', mealId, delta } });
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
                className="bx-btn"
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
                className="bx-btn"
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

  // Interactive meal list for the build-a-box flow: each meal has Add / ＋ / − controls
  function renderSelectableMeals(meals) {
    return (
      <div className="chat-scrollbar" style={{ marginTop: '8px', maxHeight: '240px', overflowY: 'auto' }}>
        {meals.map((meal, i) => {
          const qty = meal.selectedQty || 0;
          const isAdded = qty > 0;
          return (
            <div key={meal.id || i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 10px', borderRadius: '10px',
              background: isAdded ? '#fff8ed' : (i % 2 === 0 ? '#f9fafb' : '#fff'),
              border: isAdded ? '1px solid #ffce93' : '1px solid transparent',
              fontSize: '12px', marginBottom: '3px',
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontWeight: 600, color: '#333' }}>{meal.name}</span>
                {meal.allergens?.length > 0 && (
                  <span style={{ fontSize: '10px', color: '#ef5350', marginLeft: '6px' }}>
                    ⚠️ {meal.allergens.join(', ')}
                  </span>
                )}
                <div style={{ fontSize: '10px', color: '#999' }}>
                  {meal.price} EGP{meal.calories ? ` · ${meal.calories} cal` : ''}
                </div>
              </div>
              {!isAdded ? (
                <button
                  className="bx-btn"
                  onClick={() => addMeal(meal.id)}
                  disabled={loading}
                  aria-label={`Add ${meal.name}`}
                  style={{
                    flexShrink: 0, marginLeft: '8px', padding: '6px 12px', borderRadius: '8px',
                    border: '1.5px solid #f57c00', background: '#fff', color: '#e65100',
                    fontSize: '11px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  ＋ {language === 'en' ? 'Add' : 'أضف'}
                </button>
              ) : (
                <div style={{
                  flexShrink: 0, marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '6px',
                  background: '#fff', borderRadius: '8px', padding: '2px',
                }}>
                  <button className="bx-btn" onClick={() => changeMealQty(meal.id, -1)} disabled={loading} aria-label="Decrease quantity"
                    style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontWeight: 700 }}>−</button>
                  <span style={{ fontWeight: 700, minWidth: '14px', textAlign: 'center' }}>{qty}</span>
                  <button className="bx-btn" onClick={() => changeMealQty(meal.id, +1)} disabled={loading} aria-label="Increase quantity"
                    style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontWeight: 700 }}>＋</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Running selection summary + live price for the build-a-box flow
  function renderSelectionSummary(selection, priceInfo) {
    if ((!selection || selection.length === 0) && !priceInfo) return null;
    return (
      <div style={{
        marginTop: '8px', background: '#fffaf0', border: '1px solid #ffe0b2',
        borderRadius: '10px', padding: '10px 12px', fontSize: '12px',
      }}>
        {selection && selection.length > 0 && (
          <>
            <div style={{ fontWeight: 700, color: '#e65100', marginBottom: '4px' }}>
              {language === 'en' ? 'Your box' : 'البوكس بتاعك'}
            </div>
            {selection.map((item, i) => (
              <div key={item.id || i} style={{ display: 'flex', justifyContent: 'space-between', color: '#555', padding: '1px 0' }}>
                <span>{item.name}{item.qty > 1 ? ` ×${item.qty}` : ''}</span>
                <span>{item.price != null ? `${Math.round(item.price * (item.qty || 1))} EGP` : ''}</span>
              </div>
            ))}
          </>
        )}
        {priceInfo && (
          <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #ffe0b2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: '#333' }}>{language === 'en' ? 'Total' : 'الإجمالي'}</span>
            <span style={{ fontWeight: 800, color: '#e65100', fontSize: '14px' }}>{priceInfo.totalPrice} EGP</span>
          </div>
        )}
        {priceInfo?.allergens?.length > 0 && (
          <div style={{ marginTop: '4px', fontSize: '10px', color: '#ef6c00' }}>
            ⚠️ {language === 'en' ? 'Contains: ' : 'يحتوي على: '}{priceInfo.allergens.join(', ')}
          </div>
        )}
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
          className="bx-btn"
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
          className="bx-btn"
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

  // ── Window geometry ───────────────────────────────────────────────────────
  const isRTL = language === 'ar';
  const windowStyle = isMobile
    ? { position: 'fixed', inset: 0, width: '100%', height: '100dvh', borderRadius: 0 }
    : {
        position: 'fixed', right: '24px', bottom: '96px',
        width: isMaximized ? 'min(760px, calc(100vw - 48px))' : `${size.width}px`,
        height: isMaximized ? 'calc(100vh - 120px)' : `${size.height}px`,
        maxWidth: 'calc(100vw - 48px)', maxHeight: 'calc(100vh - 120px)',
        borderRadius: '20px',
      };

  const conversationStarted = messages.some(m => m.from === 'user');
  const showLauncherDot = !isOpen && conversationStarted;

  const iconBtnStyle = {
    background: 'rgba(255,255,255,0.18)', border: 'none', color: 'white',
    borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer',
    fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.2s', flexShrink: 0,
  };

  return (
    <div className="bx-chat-root" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
      <style>{`
        @keyframes chatSlideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes dotPulse { 0%,100% { opacity:.3; transform:scale(.75); } 50% { opacity:1; transform:scale(1); } }
        .chat-scrollbar::-webkit-scrollbar { width: 6px; }
        .chat-scrollbar::-webkit-scrollbar-thumb { background: #e7d3b3; border-radius: 4px; }
        .chat-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .bx-chat-root button:focus-visible { outline: 2px solid #f57c00; outline-offset: 2px; }
        .bx-btn:disabled { opacity: .55; }
        .bx-resize-grip:hover > i { border-color: #fff !important; }
      `}</style>

      {/* Floating launcher with carrot mascot */}
      <button
        className="bx-btn"
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? (isRTL ? 'إغلاق المحادثة' : 'Close chat') : (isRTL ? 'افتح المحادثة' : 'Open chat')}
        aria-expanded={isOpen}
        style={{
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff9800, #f57c00)',
          color: 'white', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(255,152,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s',
          overflow: 'visible', padding: 0, position: 'relative',
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
          <img src="/carrot-chef.png" alt="" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '50%' }} />
        )}
        {showLauncherDot && (
          <span aria-hidden style={{
            position: 'absolute', top: '2px', right: '2px', width: '14px', height: '14px',
            background: '#e53935', borderRadius: '50%', border: '2px solid #fff',
          }} />
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Boxify Chef chat"
          style={{
            ...windowStyle,
            background: '#fff',
            boxShadow: '0 12px 50px rgba(0,0,0,0.18)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            fontFamily: 'Inter, system-ui, sans-serif',
            zIndex: 1001, animation: 'chatSlideUp 0.25s ease',
          }}
        >
          {/* Desktop resize grip (top-left corner) */}
          {!isMobile && !isMaximized && (
            <div
              className="bx-resize-grip"
              onPointerDown={onResizeStart}
              title={isRTL ? 'تغيير الحجم' : 'Drag to resize'}
              style={{ position: 'absolute', top: 0, left: 0, width: '22px', height: '22px', cursor: 'nwse-resize', zIndex: 6 }}
            >
              <i style={{
                position: 'absolute', top: '6px', left: '6px', width: '8px', height: '8px',
                borderTop: '2px solid rgba(255,255,255,0.65)', borderLeft: '2px solid rgba(255,255,255,0.65)',
                borderTopLeftRadius: '3px',
              }} />
            </div>
          )}

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #ff9800, #f57c00)',
            color: 'white', padding: '12px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0, gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <img src="/carrot-chef.png" alt="" style={{
                width: '36px', height: '36px', borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.4)', objectFit: 'cover', flexShrink: 0,
              }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>Boxify Chef</div>
                <div style={{ fontSize: '11px', opacity: 0.85, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#7CFC9A', display: 'inline-block' }} />
                  {language === 'en' ? 'Online' : 'متصل'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {!isMobile && (
                <button
                  className="bx-btn"
                  onClick={() => setIsMaximized(m => !m)}
                  style={iconBtnStyle}
                  aria-label={isMaximized ? (isRTL ? 'استعادة الحجم' : 'Restore size') : (isRTL ? 'تكبير' : 'Maximize')}
                  title={isMaximized ? (isRTL ? 'استعادة' : 'Restore') : (isRTL ? 'تكبير' : 'Maximize')}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                >
                  {isMaximized ? '🗗' : '🗖'}
                </button>
              )}
              <button
                className="bx-btn"
                onClick={clearChat}
                style={iconBtnStyle}
                aria-label={language === 'en' ? 'New chat' : 'محادثة جديدة'}
                title={language === 'en' ? 'New chat' : 'محادثة جديدة'}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
              >
                🔄
              </button>
              <button
                className="bx-btn"
                onClick={() => setIsOpen(false)}
                style={iconBtnStyle}
                aria-label={isRTL ? 'إغلاق' : 'Close'}
                title={isRTL ? 'إغلاق' : 'Close'}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Language selection (fallback; usually auto-selected) */}
          {!language ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '24px', background: '#fffaf0',
            }}>
              <img src="/carrot-chef.png" alt="" style={{
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
                    className="bx-btn"
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
              <div
                ref={messagesContainerRef}
                onScroll={onMessagesScroll}
                className="chat-scrollbar"
                style={{
                  flex: 1, overflowY: 'auto', padding: '14px',
                  display: 'flex', flexDirection: 'column', gap: '10px',
                  background: '#fefefe', position: 'relative',
                }}
              >
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
                        maxWidth: '80%', fontSize: '13.5px', lineHeight: 1.6,
                        direction: isRTL ? 'rtl' : 'ltr',
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        boxShadow: msg.from === 'user'
                          ? '0 2px 8px rgba(255,152,0,0.2)'
                          : '0 1px 4px rgba(0,0,0,0.06)',
                        border: msg.from === 'bot' ? '1px solid #f0f0f0' : 'none',
                      }}>
                        {msg.text}
                      </div>
                    </div>

                    {/* Timestamp */}
                    {msg.time && (
                      <div style={{
                        fontSize: '9.5px', color: '#b0b0b0', marginTop: '3px',
                        textAlign: msg.from === 'user' ? 'right' : 'left',
                        marginLeft: msg.from === 'bot' ? '32px' : 0,
                        marginRight: msg.from === 'user' ? '2px' : 0,
                      }}>
                        {fmtTime(msg.time)}
                      </div>
                    )}

                    {/* Rich content: box cards */}
                    {msg.from === 'bot' && msg.boxes && msg.boxes.length > 0 && (
                      <div style={{ marginLeft: '32px' }}>
                        {renderBoxCards(msg.boxes)}
                      </div>
                    )}

                    {/* Rich content: meal list (legacy / read-only) */}
                    {msg.from === 'bot' && msg.meals && msg.meals.length > 0 && (
                      <div style={{ marginLeft: '32px' }}>
                        {renderMealList(msg.meals)}
                      </div>
                    )}

                    {/* Rich content: interactive build-a-box meal selection */}
                    {msg.from === 'bot' && msg.selectableMeals && msg.selectableMeals.length > 0 && (
                      <div style={{ marginLeft: '32px' }}>
                        {renderSelectableMeals(msg.selectableMeals)}
                      </div>
                    )}

                    {/* Rich content: build-a-box selection summary + price */}
                    {msg.from === 'bot' && ((msg.selection && msg.selection.length > 0) || (msg.priceInfo && msg.flowState !== 'SELECTING')) && (
                      <div style={{ marginLeft: '32px' }}>
                        {renderSelectionSummary(msg.selection, msg.priceInfo)}
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

                    {/* Quick action buttons (welcome chips + build-a-box step chips) */}
                    {msg.from === 'bot' && msg.quickActions && (
                      <div style={{ marginLeft: '32px', display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {msg.quickActions.map((qa, j) => {
                          const isCancel = qa.action?.type === 'cancel';
                          const isPrimary = qa.action?.type === 'confirm' || qa.action?.type === 'done_selecting';
                          return (
                            <button
                              key={j}
                              className="bx-btn"
                              onClick={() => dispatchQuickAction(qa)}
                              disabled={loading}
                              style={{
                                padding: '7px 14px', borderRadius: '20px',
                                border: isCancel ? '1.5px solid #e0e0e0' : '1.5px solid #ff9800',
                                background: isPrimary ? 'linear-gradient(135deg, #ff9800, #f57c00)' : '#fff',
                                color: isPrimary ? '#fff' : (isCancel ? '#999' : '#e65100'),
                                fontSize: '12px', cursor: loading ? 'not-allowed' : 'pointer',
                                fontWeight: isPrimary ? 700 : 600, transition: 'all 0.2s',
                                whiteSpace: 'nowrap', opacity: loading ? 0.6 : 1,
                              }}
                              onMouseOver={e => { if (!isPrimary) e.currentTarget.style.background = '#fff3e0'; }}
                              onMouseOut={e => { if (!isPrimary) e.currentTarget.style.background = '#fff'; }}
                            >
                              {qa.text}
                            </button>
                          );
                        })}
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
                      {[0, 1, 2].map(d => (
                        <div key={d} style={{
                          width: '7px', height: '7px', borderRadius: '50%',
                          background: '#ff9800',
                          animation: `dotPulse 1.2s ease-in-out ${d * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Login prompt for guests trying actions */}
                {!user && messages.length > 0 && (
                  <div style={{ textAlign: 'center', padding: '8px', marginTop: '4px' }}>
                    <p style={{ fontSize: '11px', color: '#999', margin: '0 0 4px' }}>
                      {language === 'en'
                        ? 'Sign in for personalized recommendations and to build custom boxes'
                        : 'سجل دخول عشان نقدر نقترحلك بوكسات ونبنيلك بوكس مخصص'}
                    </p>
                    <button
                      className="bx-btn"
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

              {/* Scroll-to-bottom button */}
              {showScrollBtn && (
                <button
                  className="bx-btn"
                  onClick={scrollToBottom}
                  aria-label={isRTL ? 'انزل لآخر رسالة' : 'Scroll to latest'}
                  style={{
                    position: 'absolute', bottom: '74px', left: '50%', transform: 'translateX(-50%)',
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: '#fff', color: '#f57c00', border: '1px solid #ffd9a8',
                    boxShadow: '0 3px 12px rgba(0,0,0,0.15)', cursor: 'pointer',
                    fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 4,
                  }}
                >
                  ↓
                </button>
              )}

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
                  aria-label={language === 'en' ? 'Message' : 'الرسالة'}
                  disabled={loading}
                  style={{
                    flex: 1, padding: '11px 14px', borderRadius: '20px',
                    border: '1.5px solid #e0e0e0', outline: 'none',
                    direction: isRTL ? 'rtl' : 'ltr',
                    fontSize: '14px', background: loading ? '#fafafa' : '#fff',
                    transition: 'border-color 0.2s',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#ff9800'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e0e0e0'}
                />
                <button
                  className="bx-btn"
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  aria-label={language === 'en' ? 'Send' : 'إرسال'}
                  style={{
                    width: '42px', height: '42px', borderRadius: '50%',
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
