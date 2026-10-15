import assert from 'node:assert/strict';
import { test } from 'node:test';
import { watchProcessing, mergeServerDraft } from './processing.js';

const scheduler = () => {
  const pending = [];
  return { pending, schedule: (fn) => { pending.push(fn); return fn; }, cancel: () => {} };
};

test('polling updates a processing meeting and stops when results are ready', async () => {
  const timers = scheduler();
  const seen = [];
  const client = { getMeetingDetail: async () => ({ processing: { is_processing: seen.length === 0 } }) };
  watchProcessing(client, 'uuid', { ...timers, onUpdate: (m) => seen.push(m), onError: assert.fail });
  await timers.pending.shift()();
  assert.equal(timers.pending.length, 1);
  await timers.pending.shift()();
  assert.equal(seen.length, 2);
  assert.equal(timers.pending.length, 0);
});

test('a late response cannot update a meeting after navigating away', async () => {
  const timers = scheduler();
  let resolve;
  const result = new Promise((r) => { resolve = r; });
  const stop = watchProcessing({ getMeetingDetail: () => result }, 'old', {
    ...timers, onUpdate: assert.fail, onError: assert.fail,
  });
  const inFlight = timers.pending.shift()();
  stop();
  resolve({ processing: { is_processing: true } });
  await inFlight;
  assert.equal(timers.pending.length, 0);
});

test('a failed GET retains existing results and schedules another check', async () => {
  const timers = scheduler();
  const errors = [];
  watchProcessing({ getMeetingDetail: async () => { throw new Error('503'); } }, 'uuid', {
    ...timers, onUpdate: assert.fail, onError: (e) => errors.push(e.message),
  });
  await timers.pending.shift()();
  assert.deepEqual(errors, ['503']);
  assert.equal(timers.pending.length, 1);
});

test('new server results update untouched drafts and preserve user edits', () => {
  assert.equal(mergeServerDraft('', '', 'new protocol'), 'new protocol');
  assert.equal(mergeServerDraft('my edit', 'old protocol', 'new protocol'), 'my edit');
  assert.equal(mergeServerDraft('custom-template', 'standard', 'other'), 'custom-template');
});
