const express = require('express');
const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Proxy helper — forwards requests to the Python AI service.
 * Now also forwards the user's JWT token so the AI service can
 * call authenticated backend endpoints (cart, subscriptions, etc.)
 */
async function callAIService(endpoint, body, method = 'POST') {
  console.log(`🤖 AI service ${method} ${endpoint}`);
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (method !== 'GET' && method !== 'DELETE') {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(`${AI_SERVICE_URL}${endpoint}`, options);
    const data = await response.json();
    console.log('✅ AI response:', JSON.stringify(data).substring(0, 150));
    return data;
  } catch (error) {
    console.error('❌ AI Service Error:', error.message);
    throw error;
  }
}

// @route   POST /api/chatbot/chat
// @access  Public (but personalized features require auth)
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId, flow, action } = req.body;
    // Structured flow actions (e.g. selecting a meal) may carry an empty message,
    // so only require a message when no explicit flow/action is present.
    if (!message && !flow && !action) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Extract user token from the Authorization header and forward it to the AI service
    let userToken = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      userToken = req.headers.authorization.split(' ')[1];
    }

    // Language is auto-detected by the AI service from the message text.
    // `flow` and `action` drive the deterministic button-driven flows.
    const data = await callAIService('/chat', {
      message: message || '',
      session_id: sessionId || 'default',
      user_token: userToken,
      flow: flow || null,
      action: action || null,
    });

    return res.json(data);
  } catch (error) {
    console.error('Chatbot error:', error.message);
    return res.status(500).json({
      answer: 'Sorry, something went wrong. Please try again.',
      error: error.message,
    });
  }
});

// @route   DELETE /api/chatbot/session/:sessionId
// @access  Public
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const response = await fetch(
      `${AI_SERVICE_URL}/session/${req.params.sessionId}`,
      { method: 'DELETE' }
    );
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to clear session' });
  }
});

module.exports = router;