process.env.API_KEY = 'test-key-123';

const test = require('node:test');
const assert = require('node:assert');
const app = require('./server');

function withServer(fn) {
  return async () => {
    const server = app.listen(0);
    const { port } = server.address();
    try {
      await fn('http://127.0.0.1:' + port);
    } finally {
      server.close();
    }
  };
}

const AUTH = { 'x-api-key': 'test-key-123' };

test('health endpoint is open', withServer(async (base) => {
  const res = await fetch(base + '/health');
  assert.strictEqual(res.status, 200);
}));

test('patients without API key is rejected (401)', withServer(async (base) => {
  const res = await fetch(base + '/patients');
  assert.strictEqual(res.status, 401);
}));

test('patients with wrong API key is rejected (401)', withServer(async (base) => {
  const res = await fetch(base + '/patients', { headers: { 'x-api-key': 'wrong' } });
  assert.strictEqual(res.status, 401);
}));

test('patients with valid API key returns data', withServer(async (base) => {
  const res = await fetch(base + '/patients', { headers: AUTH });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.length, 3);
}));

test('invalid patient id is rejected (400)', withServer(async (base) => {
  const res = await fetch(base + '/patients/abc', { headers: AUTH });
  assert.strictEqual(res.status, 400);
}));

test('unknown patient id returns 404', withServer(async (base) => {
  const res = await fetch(base + '/patients/999', { headers: AUTH });
  assert.strictEqual(res.status, 404);
}));

test('security headers are set and framework is hidden', withServer(async (base) => {
  const res = await fetch(base + '/health');
  assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
  assert.strictEqual(res.headers.get('x-powered-by'), null);
}));
