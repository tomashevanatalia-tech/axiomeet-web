import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadWorkspaceResources, loadWorkspaceResource } from './resources.js';

function client(overrides = {}) {
  return {
    getMeetingTranscript: async () => ({ segments: [{ text: 'Recorded speech' }] }),
    getProtocolVersions: async () => ({ versions: [{ id: 1 }] }),
    getProtocolTemplates: async () => ({ templates: [{ id: 'standard' }] }),
    listShareLinks: async () => ({ links: [{ id: 2 }] }),
    ...overrides,
  };
}

test('a transcript outage is reported while other tabs retain their results', async () => {
  const { data, errors } = await loadWorkspaceResources(client({
    getMeetingTranscript: async () => { throw new Error('HTTP 503'); },
  }), 'meeting-1');
  assert.deepEqual(errors, { transcript: 'HTTP 503' });
  assert.equal(Object.hasOwn(data, 'transcript'), false);
  assert.deepEqual(data.versions, { versions: [{ id: 1 }] });
  assert.deepEqual(data.shareLinks, { links: [{ id: 2 }] });
});

test('genuinely empty data is distinct from an unsuccessful request', async () => {
  const { data, errors } = await loadWorkspaceResources(client({
    getMeetingTranscript: async () => null,
    getProtocolVersions: async () => ({ versions: [] }),
  }), 'meeting-2');
  assert.deepEqual(errors, {});
  assert.equal(data.transcript, null);
  assert.deepEqual(data.versions, { versions: [] });
});

test('each failed tab has its own error and failed mutations are never retried', async () => {
  const attempts = [];
  const fail = (name) => async () => { attempts.push(name); throw new Error(name); };
  const { data, errors } = await loadWorkspaceResources(client({
    getMeetingTranscript: fail('transcript'),
    getProtocolVersions: fail('versions'),
    getProtocolTemplates: fail('templates'),
    listShareLinks: fail('shareLinks'),
  }), 'meeting-3');
  assert.deepEqual(data, {});
  assert.deepEqual(errors, Object.fromEntries(attempts.map((name) => [name, name])));
  assert.equal(attempts.length, 4);
});

test('retry loads only the requested resource and forwards the meeting identifier', async () => {
  const requests = [];
  const api = client({
    getMeetingTranscript: async (uuid) => { requests.push(uuid); return { segments: [] }; },
    getProtocolVersions: async () => { throw new Error('must not reload history'); },
  });
  assert.deepEqual(await loadWorkspaceResource(api, 'meeting-4', 'transcript'), { segments: [] });
  assert.deepEqual(requests, ['meeting-4']);
});

test('template loading has no meeting argument; unknown resources cannot call arbitrary client methods', async () => {
  const api = client({ getProtocolTemplates: async (...args) => { assert.deepEqual(args, []); return {}; } });
  await loadWorkspaceResource(api, 'meeting-5', 'templates');
  await assert.rejects(loadWorkspaceResource(api, 'meeting-5', 'constructor'), /Unknown workspace resource/);
});
