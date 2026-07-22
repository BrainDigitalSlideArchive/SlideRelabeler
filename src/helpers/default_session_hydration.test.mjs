import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveDefaultSessionHydration } from './default_session_hydration.js';

test('migrate default from session when default empty', () => {
  const r = resolveDefaultSessionHydration({
    defaultValue: '',
    sessionValue: 'https://x/api/v1',
  });
  assert.equal(r.migrateDefaultFromSession, true);
  assert.equal(r.hydrateSessionFromDefault, false);
  assert.equal(r.sessionValue, 'https://x/api/v1');
});

test('hydrate session from default when session empty', () => {
  const r = resolveDefaultSessionHydration({
    defaultValue: 'https://x/api/v1',
    sessionValue: '',
  });
  assert.equal(r.hydrateSessionFromDefault, true);
  assert.equal(r.migrateDefaultFromSession, false);
});

test('no-op when both set', () => {
  const r = resolveDefaultSessionHydration({
    defaultValue: 'https://default/api/v1',
    sessionValue: 'https://temp/api/v1',
  });
  assert.equal(r.migrateDefaultFromSession, false);
  assert.equal(r.hydrateSessionFromDefault, false);
});
