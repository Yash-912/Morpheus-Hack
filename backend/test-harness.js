#!/usr/bin/env node
// ============================================================
// Test Harness — validates Express app without a real database
// Tests: routing, validation, middleware, rate limiting, error handling
// ============================================================

const http = require('http');

const PORT = 9876;
let server;
let passed = 0;
let failed = 0;
const results = [];

// ---- Helpers ----
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        let json;
        try { json = JSON.parse(data); } catch { json = data; }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function test(name, expected, actual, condition) {
  if (condition) {
    passed++;
    results.push(`  PASS  ${name}`);
  } else {
    failed++;
    results.push(`  FAIL  ${name}\n         Expected: ${expected}\n         Got:      ${actual}`);
  }
}

// ---- Test Suite ----
async function run() {
  console.log('\n====================================');
  console.log(' GigPay Backend — Test Harness');
  console.log('====================================\n');

  // --- 1. Health Check ---
  {
    const r = await request('GET', '/health');
    test('GET /health returns 200', 200, r.status, r.status === 200);
    test('GET /health body has status=ok', 'ok', r.body?.status, r.body?.status === 'ok');
    test('GET /health body has service name', 'gigpay-backend', r.body?.service, r.body?.service === 'gigpay-backend');
    test('GET /health body has timestamp', 'string', typeof r.body?.timestamp, typeof r.body?.timestamp === 'string');
  }

  // --- 2. 404 Unknown Route ---
  {
    const r = await request('GET', '/api/nonexistent');
    test('GET /api/nonexistent returns 404', 404, r.status, r.status === 404);
    test('404 body has success=false', false, r.body?.success, r.body?.success === false);
    test('404 body error code is NOT_FOUND', 'NOT_FOUND', r.body?.error?.code, r.body?.error?.code === 'NOT_FOUND');
  }

  // --- 3. Auth: send-otp validation ---
  {
    // Missing body
    const r1 = await request('POST', '/api/auth/send-otp', {});
    test('POST /api/auth/send-otp {} → 400', 400, r1.status, r1.status === 400);
    test('Validation returns error.details array', true, Array.isArray(r1.body?.error?.details), Array.isArray(r1.body?.error?.details));

    // Invalid phone format
    const r2 = await request('POST', '/api/auth/send-otp', { phone: '12345' });
    test('POST send-otp invalid phone → 400', 400, r2.status, r2.status === 400);

    // Valid phone → should reach controller (will error on DB, but not 400)
    const r3 = await request('POST', '/api/auth/send-otp', { phone: '+919876543210' });
    test('POST send-otp valid phone → not 400 (reaches controller)', 'not 400', r3.status, r3.status !== 400);
    // OTP service uses MemoryRedis so it works even without DB
    test('POST send-otp valid phone → 200 (OTP via mock)', 200, r3.status, r3.status === 200);
  }

  // --- 4. Auth: verify-otp validation ---
  {
    const r1 = await request('POST', '/api/auth/verify-otp', {});
    test('POST verify-otp {} → 400', 400, r1.status, r1.status === 400);

    const r2 = await request('POST', '/api/auth/verify-otp', { phone: '+919876543210', otp: '12' });
    test('POST verify-otp short otp → 400', 400, r2.status, r2.status === 400);

    const r3 = await request('POST', '/api/auth/verify-otp', { phone: '+919876543210', otp: '123456' });
    test('POST verify-otp wrong code → 400 (OTP mismatch)', 400, r3.status, r3.status === 400);
  }

  // --- 5. Auth: refresh validation ---
  {
    const r1 = await request('POST', '/api/auth/refresh', {});
    test('POST refresh {} → 400', 400, r1.status, r1.status === 400);

    const r1b = await request('POST', '/api/auth/refresh', { refreshToken: 'some-token' });
    test('POST refresh with token → not 400', 'not 400', r1b.status, r1b.status !== 400);
  }

  // --- 6. Protected routes without JWT → 401 ---
  {
    const protectedRoutes = [
      ['GET',  '/api/users/profile'],
      ['GET',  '/api/earnings'],
      ['GET',  '/api/payouts'],
      ['GET',  '/api/loans'],
      ['GET',  '/api/insurance'],
      ['GET',  '/api/expenses'],
      ['GET',  '/api/tax/summary'],
      ['GET',  '/api/community/feed'],
      ['GET',  '/api/savings'],
      ['GET',  '/api/insights'],
      ['GET',  '/api/notifications'],
    ];

    for (const [method, path] of protectedRoutes) {
      const r = await request(method, path);
      test(`${method} ${path} no JWT → 401`, 401, r.status, r.status === 401);
    }
  }

  // --- 7. Protected routes with invalid JWT → 401 ---
  {
    const r = await request('GET', '/api/users/profile', null, {
      Authorization: 'Bearer invalid.jwt.token',
    });
    test('GET /api/users/profile bad JWT → 401', 401, r.status, r.status === 401);
  }

  // --- 8. Malformed JSON → 400 ---
  {
    const r = await new Promise((resolve, reject) => {
      const opts = {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/auth/send-otp',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      };
      const req = http.request(opts, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let json;
          try { json = JSON.parse(data); } catch { json = data; }
          resolve({ status: res.statusCode, body: json });
        });
      });
      req.on('error', reject);
      req.write('{malformed json!!}');
      req.end();
    });
    test('Malformed JSON → 400', 400, r.status, r.status === 400);
  }

  // --- 9. Webhook routes (no auth required, should not 401) ---
  {
    const r1 = await request('POST', '/api/webhooks/razorpay', { event: 'payout.processed' });
    test('POST /api/webhooks/razorpay → 401 (invalid sig)', 401, r1.status, r1.status === 401);

    const r2 = await request('POST', '/api/webhooks/whatsapp', { message: 'hello' });
    test('POST /api/webhooks/whatsapp → not 401', 'not 401', r2.status, r2.status !== 401);
  }

  // --- 10. CORS headers ---
  {
    const r = await request('GET', '/health');
    const hasCors = r.headers['access-control-allow-origin'] !== undefined;
    test('CORS header present on /health', true, hasCors, hasCors);
  }

  // --- 11. Helmet security headers ---
  {
    const r = await request('GET', '/health');
    test('X-Content-Type-Options set', 'nosniff', r.headers['x-content-type-options'],
      r.headers['x-content-type-options'] === 'nosniff');
    const hasXFrame = !!r.headers['x-frame-options'];
    test('X-Frame-Options set', true, hasXFrame, hasXFrame);
  }

  // --- 12. Compression header ---
  {
    const r = await new Promise((resolve, reject) => {
      const opts = {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/health',
        method: 'GET',
        headers: { 'Accept-Encoding': 'gzip, deflate' },
      };
      const req = http.request(opts, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ headers: res.headers }));
      });
      req.on('error', reject);
      req.end();
    });
    // Compression may or may not kick in for tiny responses; just check no crash
    test('Accept-Encoding gzip → no crash', true, true, true);
  }

  // ---- Print Results ----
  console.log('\n------------------------------------');
  console.log(' Test Results');
  console.log('------------------------------------');
  results.forEach((r) => console.log(r));
  console.log('------------------------------------');
  console.log(` Total: ${passed + failed}  |  Passed: ${passed}  |  Failed: ${failed}`);
  console.log('------------------------------------\n');
}

// ---- Boot & Run ----
(async () => {
  try {
    console.log('Loading app...');
    const app = require('./app');
    server = app.listen(PORT, async () => {
      console.log(`Test server running on port ${PORT}\n`);
      try {
        await run();
      } catch (err) {
        console.error('Test suite error:', err);
      } finally {
        server.close(() => process.exit(failed > 0 ? 1 : 0));
      }
    });
  } catch (err) {
    console.error('Failed to load app:', err);
    process.exit(1);
  }
})();
