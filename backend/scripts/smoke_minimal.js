/* Enhanced end-to-end smoke tests for key endpoints with detailed logging */
import assert from 'node:assert';
const { default: fetch } = await import('node-fetch');

// Support --remote flag or SMOKE_BASE_URL env var
const args = process.argv.slice(2);
const remoteFlagIndex = args.indexOf('--remote');
const BASE = remoteFlagIndex !== -1 && args[remoteFlagIndex + 1]
  ? args[remoteFlagIndex + 1].replace(/\/$/, '') + '/api'
  : process.env.SMOKE_BASE_URL || 'http://localhost:5001/api';

const results = [];

const json = async (path, method = 'GET', body) => {
  const startTime = Date.now();
  const url = `${BASE}${path}`;
  
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    const latency = Date.now() - startTime;
    const text = await res.text();
    let data;
    try { 
      data = JSON.parse(text); 
    } catch { 
      data = { raw: text }; 
    }
    
    // Check for fallback indicators
    const fallbackTriggered = 
      text.includes('fallback') || 
      text.includes('offline') || 
      text.includes('mock') ||
      (data && (data.fallback || data.offline || data.mock));
    
    return { res, data, latency, text, fallbackTriggered };
  } catch (error) {
    const latency = Date.now() - startTime;
    return { 
      error, 
      latency, 
      res: { status: 0 }, 
      data: {}, 
      text: error.message,
      fallbackTriggered: false
    };
  }
};

const logResult = (endpoint, method, result) => {
  const { res, data, latency, text, fallbackTriggered, error } = result;
  const statusCode = res?.status || 0;
  const responsePreview = text ? text.substring(0, 300) : 'No response body';
  const passed = !error && statusCode >= 200 && statusCode < 300;
  
  const resultObj = {
    endpoint: `${method} ${endpoint}`,
    statusCode,
    latency: `${latency}ms`,
    responsePreview,
    fallbackTriggered,
    passed,
    error: error?.message
  };
  
  results.push(resultObj);
  
  const prefix = passed ? 'PASS' : 'FAIL';
  console.log(`\n[${prefix}] ${method} ${endpoint}`);
  console.log(`  Status Code: ${statusCode}`);
  console.log(`  Latency: ${latency}ms`);
  console.log(`  Fallback Triggered: ${fallbackTriggered ? 'YES' : 'NO'}`);
  if (error) {
    console.log(`  Error: ${error.message}`);
  }
  console.log(`  Response Preview (first 300 chars):`);
  console.log(`  ${responsePreview.replace(/\n/g, ' ')}`);
};

(async () => {
  console.log('='.repeat(80));
  console.log('SMOKE TEST SUITE - REMOTE STAGING TESTS');
  console.log('='.repeat(80));
  console.log(`Testing against: ${BASE}`);
  console.log(`Started at: ${new Date().toISOString()}\n`);

  // 1) AI Suggestions
  try {
    const result = await json('/ai/suggestions', 'POST', {
      userId: 'smoke-user',
      profile: { age: 16, interests: ['tech'] },
      options: { count: 2 }
    });
    logResult('/ai/suggestions', 'POST', result);
    if (result.error || (result.res.status !== 200 && result.res.status !== 0)) {
      throw new Error(`Status ${result.res.status}`);
    }
  } catch (e) {
    logResult('/ai/suggestions', 'POST', { 
      error: e, 
      res: { status: 0 }, 
      latency: 0, 
      text: e.message,
      fallbackTriggered: false
    });
  }

  // 2) AI Chat
  try {
    const result = await json('/ai/chat', 'POST', {
      message: 'What is a stock?',
      userProfile: { age: 16 }
    });
    logResult('/ai/chat', 'POST', result);
    if (result.error || result.res.status !== 200) {
      throw new Error(`Status ${result.res.status}`);
    }
    const reply = result.data?.reply || '';
    if (typeof reply !== 'string' || reply.length === 0) {
      throw new Error('Empty or invalid reply');
    }
  } catch (e) {
    logResult('/ai/chat', 'POST', { 
      error: e, 
      res: { status: 0 }, 
      latency: 0, 
      text: e.message,
      fallbackTriggered: false
    });
  }

  // 3) Market Quote
  try {
    const result = await json('/market/quote/AAPL', 'GET');
    logResult('/market/quote/AAPL', 'GET', result);
    // Market endpoint may return non-200 in some cases, so we log but don't fail
  } catch (e) {
    logResult('/market/quote/AAPL', 'GET', { 
      error: e, 
      res: { status: 0 }, 
      latency: 0, 
      text: e.message,
      fallbackTriggered: false
    });
  }

  // 4) Education Progress
  try {
    const result = await json('/education/progress', 'POST', {
      userId: 'smoke-user',
      lessonId: 'intro-investing',
      progress: 20
    });
    logResult('/education/progress', 'POST', result);
    if (result.error || ![200, 201].includes(result.res.status)) {
      throw new Error(`Status ${result.res.status}`);
    }
  } catch (e) {
    logResult('/education/progress', 'POST', { 
      error: e, 
      res: { status: 0 }, 
      latency: 0, 
      text: e.message,
      fallbackTriggered: false
    });
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`\nDetailed Results:`);
  results.forEach(r => {
    const status = r.passed ? '✓' : '✗';
    console.log(`  ${status} ${r.endpoint} - ${r.statusCode} (${r.latency})`);
  });
  
  if (failed > 0) {
    console.log('\n❌ SMOKE TESTS FAILED');
    process.exitCode = 1;
  } else {
    console.log('\n✅ ALL SMOKE TESTS PASSED');
  }
  
  console.log(`\nCompleted at: ${new Date().toISOString()}`);
  console.log('='.repeat(80));
})();


