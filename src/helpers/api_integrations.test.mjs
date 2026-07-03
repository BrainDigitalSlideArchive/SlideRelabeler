import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getEnabledApiIntegrations,
  resolveSelectedApiIntegration,
} from './api_integrations.js';

function makeState({ esmEnabled = true, lastSelectedId = 'esm' } = {}) {
  return {
    esm: { integrationEnabled: esmEnabled },
    apiIntegrations: { lastSelectedId },
  };
}

test('getEnabledApiIntegrations returns eSM when integration is enabled', () => {
  const enabled = getEnabledApiIntegrations(makeState({ esmEnabled: true }));
  assert.equal(enabled.length, 1);
  assert.equal(enabled[0].id, 'esm');
  assert.equal(enabled[0].label, 'eSlideManager');
});

test('getEnabledApiIntegrations returns empty when eSM is disabled', () => {
  assert.deepEqual(getEnabledApiIntegrations(makeState({ esmEnabled: false })), []);
});

test('resolveSelectedApiIntegration prefers persisted id when still enabled', () => {
  const selected = resolveSelectedApiIntegration(makeState({
    esmEnabled: true,
    lastSelectedId: 'esm',
  }));
  assert.equal(selected?.id, 'esm');
});

test('resolveSelectedApiIntegration falls back to first enabled when persisted id is unknown', () => {
  const selected = resolveSelectedApiIntegration(makeState({
    esmEnabled: true,
    lastSelectedId: 'unknown',
  }));
  assert.equal(selected?.id, 'esm');
});

test('resolveSelectedApiIntegration returns null when none enabled', () => {
  assert.equal(resolveSelectedApiIntegration(makeState({ esmEnabled: false })), null);
});
