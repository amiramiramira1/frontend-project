const express = require('express');
const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function callAIService(endpoint, body) {
  console.log('🤖 Calling AI service:', endpoint, JSON.stringify(body));
  try {
    const response = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    console.log('✅ AI response:', JSON.stringify(data).substring(0, 100));
    return data;
  } catch (error) {
    console.error('❌ AI Service Error:', error.message);
    throw error;
  }
}

router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId, language } = req.body;
    if (!message) return res.status(400).json({ error: 'مفيش رسالة' });

    const data = await callAIService('/chat', {
      message,
      session_id: sessionId || 'default',
      language: language || 'ar',
    });
    return res.json(data);
  } catch (error) {
    console.error('Chatbot error:', error.message);
    return res.status(500).json({
      answer: 'معلش حصلت مشكلة، حاولي تاني',
      error: error.message,
    });
  }
});

// ── FIX: بنبعت الداتا الصح للـ ai-service ─────────────────────────────────
router.post('/recommend', async (req, res) => {
  try {
    const { diet, goal, people, budget, allergies, language, mode } = req.body;

    const data = await callAIService('/recommend', {
      diet:      diet      || '',
      goal:      goal      || '',
      people:    people    || '',
      budget:    budget    || '',
      allergies: allergies || '',
      language:  language  || 'ar',
      mode:      mode      || 'boxes',
    });

    return res.json(data);
  } catch (error) {
    console.error('Recommendation error:', error.message);
    return res.status(500).json({
      recommendation: 'معلش مقدرناش نوصلك باقتراح، حاولي تاني 😅',
      error: error.message,
    });
  }
});

router.delete('/session/:sessionId', async (req, res) => {
  try {
    const response = await fetch(
      `${AI_SERVICE_URL}/session/${req.params.sessionId}`,
      { method: 'DELETE' }
    );
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: 'في مشكلة' });
  }
});

module.exports = router;