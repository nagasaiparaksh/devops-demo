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

test('GET /health returns ok', withServer(async (base) => {
  const res = await fetch(base + '/health');
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.status, 'ok');
}));

test('GET / returns a message and version', withServer(async (base) => {
  const res = await fetch(base + '/');
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.ok(body.message);
  assert.ok(body.version);
}));
