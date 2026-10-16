import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requestJson, requestTimeoutMs } from '../http.js';

test('ordinary and long operations have explicit timeout classes', () => {
  assert.equal(requestTimeoutMs('/api/v1/client/meetings'), 30_000);
  for (const path of ['/regenerate-protocol', '/upload', '/transcript', '/push-to-crm', '/distribute']) {
    assert.ok(requestTimeoutMs(path) >= 60_000);
  }
});

test('a timed out safe read retries once and aborts the first transport', async () => {
  const signals = [];
  const fetchImpl = async (_url, { signal }) => {
    signals.push(signal);
    if (signals.length === 1) return new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason)));
    return new Response(JSON.stringify({ ok: true }));
  };
  const result = await requestJson('/read', {}, { fetchImpl, timeoutMs: 5 });
  assert.deepEqual(result.data, { ok: true });
  assert.equal(signals.length, 2);
  assert.ok(signals[0].aborted);
});

test('a timed out mutation is never automatically repeated', async () => {
  let calls = 0;
  const fetchImpl = (_url, { signal }) => {
    calls++;
    return new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason)));
  };
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    calls = 0;
    await assert.rejects(requestJson('/protocol', { method }, { fetchImpl, timeoutMs: 5 }), { name: 'TimeoutError' });
    assert.equal(calls, 1);
  }
});

test('timeout covers a stalled response body as well as response headers', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    return { status: 200, json: () => new Promise(() => {}) };
  };
  await assert.rejects(requestJson('/read', {}, { fetchImpl, timeoutMs: 5 }), { name: 'TimeoutError' });
  assert.equal(calls, 2);
});

test('caller cancellation stops a safe read without retrying', async () => {
  const controller = new AbortController();
  let calls = 0;
  const fetchImpl = (_url, { signal }) => {
    calls++;
    controller.abort(new DOMException('User navigated away', 'AbortError'));
    return Promise.reject(signal.reason);
  };
  await assert.rejects(requestJson('/read', { signal: controller.signal }, { fetchImpl, timeoutMs: 5 }), { name: 'AbortError' });
  assert.equal(calls, 1);
});

test('HTTP failures are returned without retry and successful requests clear their timer', async () => {
  let calls = 0;
  let signal;
  const fetchImpl = async (_url, options) => {
    calls++;
    signal = options.signal;
    return new Response(JSON.stringify({ error: 'invalid' }), { status: 400 });
  };
  const result = await requestJson('/read', {}, { fetchImpl, timeoutMs: 5 });
  assert.equal(result.response.status, 400);
  assert.equal(calls, 1);
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.ok(!signal.aborted);
});
