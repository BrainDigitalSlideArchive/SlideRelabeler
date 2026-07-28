import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getEnabledUploadDestinations,
  isDsaUploadIntegrationEnabled,
  isGlobusUploadIntegrationEnabled,
} from './upload_integrations.js';

function makeState({ dsa = false, globus = false } = {}) {
  return {
    config: {
      dsa_upload: { integrationEnabled: dsa },
      globus_upload: { integrationEnabled: globus },
    },
  };
}

test('isDsaUploadIntegrationEnabled requires === true', () => {
  assert.equal(isDsaUploadIntegrationEnabled(makeState({ dsa: true })), true);
  assert.equal(isDsaUploadIntegrationEnabled(makeState({ dsa: false })), false);
  assert.equal(isDsaUploadIntegrationEnabled({ config: { dsa_upload: {} } }), false);
  assert.equal(isDsaUploadIntegrationEnabled({}), false);
});

test('isGlobusUploadIntegrationEnabled requires === true', () => {
  assert.equal(isGlobusUploadIntegrationEnabled(makeState({ globus: true })), true);
  assert.equal(isGlobusUploadIntegrationEnabled(makeState({ globus: false })), false);
});

test('getEnabledUploadDestinations returns only enabled destinations', () => {
  assert.deepEqual(getEnabledUploadDestinations(makeState()), []);
  assert.deepEqual(getEnabledUploadDestinations(makeState({ dsa: true })), [
    { value: 'dsa', label: 'DSA' },
  ]);
  assert.deepEqual(getEnabledUploadDestinations(makeState({ globus: true })), [
    { value: 'globus', label: 'Globus' },
  ]);
  assert.deepEqual(getEnabledUploadDestinations(makeState({ dsa: true, globus: true })), [
    { value: 'dsa', label: 'DSA' },
    { value: 'globus', label: 'Globus' },
  ]);
});
