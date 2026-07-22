import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveDsaUrlHydration } from './dsa_default_url.js';

test('migrate default from session when default empty', () => {
  const r = resolveDsaUrlHydration({ default_api_url: '' }, { api_url: 'https://x/api/v1' });
  assert.equal(r.migrateDefaultFromSession, true);
  assert.equal(r.hydrateSessionFromDefault, false);
});

test('hydrate session from default when session empty', () => {
  const r = resolveDsaUrlHydration(
    { default_api_url: 'https://x/api/v1' },
    { api_url: '' },
  );
  assert.equal(r.hydrateSessionFromDefault, true);
  assert.equal(r.migrateDefaultFromSession, false);
});

test('no-op when both set', () => {
  const r = resolveDsaUrlHydration(
    { default_api_url: 'https://default/api/v1' },
    { api_url: 'https://temp/api/v1' },
  );
  assert.equal(r.migrateDefaultFromSession, false);
  assert.equal(r.hydrateSessionFromDefault, false);
});
