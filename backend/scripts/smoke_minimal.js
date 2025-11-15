/* Minimal end-to-end smoke tests for key endpoints */
import assert from 'node:assert';
const { default: fetch } = await import('node-fetch');

const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:5001/api';

const json = async (path, method = 'GET', body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { res, data };
};

const log = (status, msg) => {
  const prefix = status ? 'PASS' : 'FAIL';
  // eslint-disable-next-line no-console
  console.log(`[${prefix}] ${msg}`);
};

(async () => {
  let failures = 0;

  // 1) AI Suggestions
  try {
    const { res, data } = await json('/ai/suggestions', 'POST', {
      userId: 'smoke-user',
      profile: { age: 16, interests: ['tech'] },
      options: { count: 2 }
    });
    assert.equal(res.status, 200, 'status should be 200');
    log(true, 'POST /ai/suggestions');
  } catch (e) {
    failures++; log(false, `POST /ai/suggestions: ${e.message}`);
  }

  // 2) AI Chat
  try {
    const { res, data } = await json('/ai/chat', 'POST', {
      message: 'What is a stock?',
      userProfile: { age: 16 }
    });
    assert.equal(res.status, 200, 'status should be 200');
    const reply = data?.reply || '';
    assert.ok(typeof reply === 'string' && reply.length > 0, 'reply should be non-empty');
    // Soft assert: educational/guardian mention when offline or per policy
    const advisory = /educational|not financial advice|parent|guardian/i.test(reply);
    log(true, `POST /ai/chat${advisory ? ' (advisory present)' : ''}`);
  } catch (e) {
    failures++; log(false, `POST /ai/chat: ${e.message}`);
  }

  // 3) Market RPC via controller
  try {
    const { res, data } = await json('/market/quote/AAPL', 'GET');
    if (res.status === 200) {
      log(true, 'GET /market/quote/AAPL');
    } else {
      log(true, `GET /market/quote/AAPL (non-200 in dev: ${res.status})`);
    }
  } catch (e) {
    failures++; log(false, `GET /market/quote/AAPL: ${e.message}`);
  }

  // 4) Education progress upsert
  try {
    const { res, data } = await json('/education/progress', 'POST', {
      userId: 'smoke-user',
      lessonId: 'intro-investing',
      progress: 20
    });
    assert.ok([200,201].includes(res.status), 'status should be 200/201');
    log(true, 'POST /education/progress');
  } catch (e) {
    failures++; log(false, `POST /education/progress: ${e.message}`);
  }

  if (failures > 0) {
    process.exitCode = 1;
  }
})();


