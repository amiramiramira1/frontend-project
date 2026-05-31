/**
 * tests/chatbot.test.js
 * =====================
 * Comprehensive Jest + Supertest test suite for the Boxify chatbot proxy layer.
 *
 * What is tested
 * --------------
 * 1. POST /api/chatbot/chat  — happy path (text reply)
 * 2. POST /api/chatbot/chat  — missing / blank message → 400
 * 3. POST /api/chatbot/chat  — JWT token forwarded to AI service
 * 4. POST /api/chatbot/chat  — language field forwarded correctly
 * 5. POST /api/chatbot/chat  — sessionId forwarding (default + custom)
 * 6. POST /api/chatbot/chat  — AI service returns toolCalls in response
 * 7. POST /api/chatbot/chat  — AI service is down → 500 with error body
 * 8. POST /api/chatbot/chat  — AI service returns non-JSON → 500
 * 9. POST /api/chatbot/chat  — response body relayed verbatim
 * 10. DELETE /api/chatbot/session/:id — session cleared on AI service
 * 11. DELETE /api/chatbot/session/:id — AI service down → 500
 *
 * NOTE: The chatbot route is a thin proxy — we mock `fetch` globally so that
 *       real HTTP calls to the Python AI service never happen.
 */

const request = require('supertest');
const app = require('../app');
const { state, connectDB, seedTestData, teardownTestData } = require('./setup');

// ─── Mock global fetch before the test module loads the route ─────────────────
// (Node 18+ has fetch built-in; Jest runs in Node so we can override it)
let mockFetch;

beforeAll(async () => {
  await connectDB();
  await seedTestData();
});

afterAll(async () => {
  await teardownTestData();
});

beforeEach(() => {
  // Fresh mock for every test to avoid bleed-over
  mockFetch = jest.fn();
  global.fetch = mockFetch;
});

afterEach(() => {
  jest.resetAllMocks();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a fake `fetch` Response-like object.
 * @param {object} body   – The JSON body the AI service should return
 * @param {number} status – HTTP status (default 200)
 */
function fakeAIResponse(body, status = 200) {
  return {
    ok: status < 400,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  };
}

/**
 * Standard successful AI answer payload.
 */
const BASIC_AI_REPLY = {
  answer: 'Hello! How can I help you with Boxify today?',
  source: 'gemini',
  toolCalls: [],
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Happy-path: POST /api/chatbot/chat
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/chatbot/chat — happy path', () => {
  it('should return 200 with the AI answer', async () => {
    mockFetch.mockResolvedValue(fakeAIResponse(BASIC_AI_REPLY));

    const res = await request(app)
      .post('/api/chatbot/chat')
      .send({ message: 'Hello', sessionId: 'sess-1', language: 'en' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('answer');
    expect(res.body.answer).toContain('Hello');
    expect(res.body.source).toBe('gemini');
  });

  it('should relay toolCalls array from AI service', async () => {
    const aiReply = {
      answer: 'Here are some keto boxes!',
      source: 'gemini',
      toolCalls: [
        { tool: 'recommend_box', args: { dietType: 'keto' }, result: { count: 2 } },
      ],
    };
    mockFetch.mockResolvedValue(fakeAIResponse(aiReply));

    const res = await request(app)
      .post('/api/chatbot/chat')
      .send({ message: 'Keto boxes please', language: 'en' });

    expect(res.statusCode).toBe(200);
    expect(res.body.toolCalls).toHaveLength(1);
    expect(res.body.toolCalls[0].tool).toBe('recommend_box');
  });

  it('should work with Arabic language', async () => {
    const arabicReply = {
      answer: 'أهلاً! كيف ممكن أساعدك؟',
      source: 'gemini',
      toolCalls: [],
    };
    mockFetch.mockResolvedValue(fakeAIResponse(arabicReply));

    const res = await request(app)
      .post('/api/chatbot/chat')
      .send({ message: 'مرحبا', language: 'ar', sessionId: 'ar-session' });

    expect(res.statusCode).toBe(200);
    expect(res.body.answer).toContain('أهلاً');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Validation: missing / blank message
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/chatbot/chat — validation', () => {
  it('should return 400 when message is missing', async () => {
    const res = await request(app)
      .post('/api/chatbot/chat')
      .send({ sessionId: 'sess-x', language: 'en' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
    // fetch should never have been called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should return 400 when message is an empty string', async () => {
    const res = await request(app)
      .post('/api/chatbot/chat')
      .send({ message: '', sessionId: 'sess-empty' });

    expect(res.statusCode).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Token forwarding
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/chatbot/chat — JWT token forwarding', () => {
  it('should forward the Bearer token to the AI service as userToken', async () => {
    mockFetch.mockResolvedValue(fakeAIResponse(BASIC_AI_REPLY));

    await request(app)
      .post('/api/chatbot/chat')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ message: 'Add keto box to cart', language: 'en' });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    const sentBody = JSON.parse(options.body);
    expect(sentBody.user_token).toBe(state.customerToken);
  });

  it('should send user_token as null when no Authorization header', async () => {
    mockFetch.mockResolvedValue(fakeAIResponse(BASIC_AI_REPLY));

    await request(app)
      .post('/api/chatbot/chat')
      .send({ message: 'Hello', language: 'en' });

    const [, options] = mockFetch.mock.calls[0];
    const sentBody = JSON.parse(options.body);
    // user_token should be null or undefined (not a real token string)
    expect(sentBody.user_token == null).toBe(true);
  });

  it('should not forward malformed Authorization headers', async () => {
    mockFetch.mockResolvedValue(fakeAIResponse(BASIC_AI_REPLY));

    await request(app)
      .post('/api/chatbot/chat')
      .set('Authorization', 'Token not-bearer-format')
      .send({ message: 'Hello', language: 'en' });

    const [, options] = mockFetch.mock.calls[0];
    const sentBody = JSON.parse(options.body);
    expect(sentBody.user_token == null).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Language — proxy does NOT forward language (auto-detected by AI service)
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/chatbot/chat — language auto-detection', () => {
  it('should NOT send a language field to the AI service', async () => {
    mockFetch.mockResolvedValue(fakeAIResponse(BASIC_AI_REPLY));

    await request(app)
      .post('/api/chatbot/chat')
      .send({ message: 'Hello', language: 'en' }); // client can still send it

    const [, options] = mockFetch.mock.calls[0];
    const sentBody = JSON.parse(options.body);
    // The proxy must NOT forward a language field anymore
    expect(sentBody).not.toHaveProperty('language');
  });

  it('should work correctly with an Arabic message (no language field needed)', async () => {
    const arabicReply = {
      answer: 'أهلاً! كيف ممكن أساعدك؟',
      source: 'gemini',
      toolCalls: [],
    };
    mockFetch.mockResolvedValue(fakeAIResponse(arabicReply));

    const res = await request(app)
      .post('/api/chatbot/chat')
      .send({ message: 'مرحبا', sessionId: 'ar-session' });

    expect(res.statusCode).toBe(200);
    expect(res.body.answer).toContain('أهلاً');

    // Confirm no language field sent
    const [, options] = mockFetch.mock.calls[0];
    const sentBody = JSON.parse(options.body);
    expect(sentBody).not.toHaveProperty('language');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. SessionId forwarding
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/chatbot/chat — sessionId forwarding', () => {
  it('should forward a custom sessionId', async () => {
    mockFetch.mockResolvedValue(fakeAIResponse(BASIC_AI_REPLY));

    await request(app)
      .post('/api/chatbot/chat')
      .send({ message: 'Hello', sessionId: 'my-unique-session-42' });

    const [, options] = mockFetch.mock.calls[0];
    const sentBody = JSON.parse(options.body);
    expect(sentBody.session_id).toBe('my-unique-session-42');
  });

  it("should default sessionId to 'default' when omitted", async () => {
    mockFetch.mockResolvedValue(fakeAIResponse(BASIC_AI_REPLY));

    await request(app)
      .post('/api/chatbot/chat')
      .send({ message: 'Hello' });

    const [, options] = mockFetch.mock.calls[0];
    const sentBody = JSON.parse(options.body);
    expect(sentBody.session_id).toBe('default');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Payload forwarding & correctness
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/chatbot/chat — payload to AI service', () => {
  it('should call AI service with method=POST and Content-Type JSON', async () => {
    mockFetch.mockResolvedValue(fakeAIResponse(BASIC_AI_REPLY));

    await request(app)
      .post('/api/chatbot/chat')
      .send({ message: 'Test message', language: 'en', sessionId: 'sess-a' });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toMatch(/\/chat$/);
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('should forward the message verbatim', async () => {
    mockFetch.mockResolvedValue(fakeAIResponse(BASIC_AI_REPLY));
    const msg = 'What are the available keto meal boxes under 150 EGP?';

    await request(app)
      .post('/api/chatbot/chat')
      .send({ message: msg, language: 'en' });

    const [, options] = mockFetch.mock.calls[0];
    const sentBody = JSON.parse(options.body);
    expect(sentBody.message).toBe(msg);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. AI service down / network error
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/chatbot/chat — AI service failure', () => {
  it('should return 500 when AI service throws a network error', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    const res = await request(app)
      .post('/api/chatbot/chat')
      .send({ message: 'Hello', language: 'en' });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('answer');
    expect(res.body.answer).toMatch(/something went wrong/i);
  });

  it('should include the error message in the 500 response', async () => {
    mockFetch.mockRejectedValue(new Error('Service Unavailable'));

    const res = await request(app)
      .post('/api/chatbot/chat')
      .send({ message: 'Hi', language: 'en' });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. AI service returns non-JSON (broken response)
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/chatbot/chat — malformed AI response', () => {
  it('should return 500 when AI service returns non-JSON', async () => {
    const badResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
    };
    mockFetch.mockResolvedValue(badResponse);

    const res = await request(app)
      .post('/api/chatbot/chat')
      .send({ message: 'Hello', language: 'en' });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('answer');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. Response body relayed verbatim
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/chatbot/chat — response relay', () => {
  it('should relay extra fields from AI service transparently', async () => {
    const extendedReply = {
      answer: 'Here are your boxes!',
      source: 'gemini',
      toolCalls: [
        {
          tool: 'recommend_box',
          args: { dietType: 'vegan' },
          result: {
            boxes: [{ id: 'b1', name: 'Vegan Delight', price: 95 }],
            count: 1,
          },
        },
      ],
    };
    mockFetch.mockResolvedValue(fakeAIResponse(extendedReply));

    const res = await request(app)
      .post('/api/chatbot/chat')
      .send({ message: 'Show me vegan boxes', language: 'en' });

    expect(res.statusCode).toBe(200);
    expect(res.body.toolCalls[0].result.boxes[0].name).toBe('Vegan Delight');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. DELETE /api/chatbot/session/:id — session clearing
// ═══════════════════════════════════════════════════════════════════════════════
describe('DELETE /api/chatbot/session/:sessionId', () => {
  it('should forward the delete request and return success', async () => {
    const aiClearReply = { message: 'Session cleared' };
    mockFetch.mockResolvedValue(fakeAIResponse(aiClearReply));

    const res = await request(app).delete('/api/chatbot/session/my-session-99');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/cleared/i);

    // Verify it called the correct AI service endpoint
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toMatch(/\/session\/my-session-99$/);
    expect(options.method).toBe('DELETE');
  });

  it('should return 500 when AI service is down during session clear', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    const res = await request(app).delete('/api/chatbot/session/ghost-session');

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 11. Edge-case: concurrent requests / unique session IDs
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/chatbot/chat — concurrent requests', () => {
  it('should handle multiple concurrent requests without interference', async () => {
    mockFetch.mockResolvedValue(fakeAIResponse(BASIC_AI_REPLY));

    const requests = Array.from({ length: 5 }, (_, i) =>
      request(app)
        .post('/api/chatbot/chat')
        .send({ message: `Request ${i}`, sessionId: `sess-concurrent-${i}`, language: 'en' })
    );

    const results = await Promise.all(requests);
    results.forEach((res) => {
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('answer');
    });
    expect(mockFetch).toHaveBeenCalledTimes(5);
  });
});
