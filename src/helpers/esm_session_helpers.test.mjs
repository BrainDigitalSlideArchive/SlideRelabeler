import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  esmConnectionKey,
  profilesShareEsmHost,
  activeProfileCompatibleWithSession,
  selectedProfileSharesSwitchOriginHost,
} from './esm_session_helpers.js';

function profile(partial = {}) {
  return {
    id: partial.id || 'p1',
    name: partial.name || 'Profile',
    url: partial.url != null ? partial.url : '',
    proxyUrl: partial.proxyUrl != null ? partial.proxyUrl : '',
  };
}

describe('profilesShareEsmHost', () => {
  it('returns true for matching configured URLs', () => {
    const a = profile({ id: 'a', url: 'https://esm.example.com' });
    const b = profile({ id: 'b', url: 'https://esm.example.com' });
    assert.equal(profilesShareEsmHost(a, b), true);
  });

  it('returns false when either profile has no request base', () => {
    const configured = profile({ id: 'a', url: 'https://esm.example.com' });
    const blank = profile({ id: 'b', url: '' });
    assert.equal(profilesShareEsmHost(configured, blank), false);
    assert.equal(profilesShareEsmHost(blank, configured), false);
    assert.equal(profilesShareEsmHost(blank, profile({ id: 'c', url: '' })), false);
  });

  it('returns false for different hosts', () => {
    const a = profile({ id: 'a', url: 'https://esm-a.example.com' });
    const b = profile({ id: 'b', url: 'https://esm-b.example.com' });
    assert.equal(profilesShareEsmHost(a, b), false);
  });
});

describe('activeProfileCompatibleWithSession', () => {
  it('requires matching sessionConnectionKey and requestBase', () => {
    const configured = profile({ id: 'a', url: 'https://esm.example.com' });
    const key = esmConnectionKey(configured);
    assert.equal(activeProfileCompatibleWithSession({
      authenticated: true,
      sessionConnectionKey: key,
      profiles: [configured],
      activeProfileId: configured.id,
    }), true);

    assert.equal(activeProfileCompatibleWithSession({
      authenticated: true,
      sessionConnectionKey: key,
      profiles: [profile({ id: 'a', url: '' })],
      activeProfileId: 'a',
    }), false);

    const other = profile({ id: 'b', url: 'https://other.example.com' });
    assert.equal(activeProfileCompatibleWithSession({
      authenticated: true,
      sessionConnectionKey: key,
      profiles: [configured, other],
      activeProfileId: other.id,
    }), false);
  });
});

describe('selectedProfileSharesSwitchOriginHost', () => {
  it('does not treat blank selected profile as same-host', () => {
    const origin = profile({ id: 'origin', url: 'https://esm.example.com' });
    const blank = profile({ id: 'blank', url: '' });
    assert.equal(selectedProfileSharesSwitchOriginHost({
      switchOriginProfileId: origin.id,
      profiles: [origin, blank],
    }, blank), false);
  });
});
