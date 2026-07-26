import test from 'node:test';
import assert from 'node:assert/strict';

import {
  GLOBUS_EXCEEDS_UPLOAD_QUEUE_MESSAGE,
  UPLOAD_METHODS_DISABLED_MESSAGE,
  globusParallelExceedsUploadQueue,
  selectUploadReadiness,
} from './uploadRouting.js';

const baseUr = { auto_upload: true, destination: 'dsa' };

const configBothEnabled = {
  dsa_upload: { integrationEnabled: true },
  globus_upload: { integrationEnabled: true },
};

const readyGlobus = {
  cli_available: true,
  api_auth: { token: 't' },
  source_endpoint: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
  target_endpoint_id: '11111111-2222-4333-8444-555555555555',
  collection_path: 'ep:/collection/path',
  globus_collection_exists: true,
};

test('DSA readiness: missing api_url', () => {
  const result = selectUploadReadiness({
    uploadRouting: baseUr,
    config: configBothEnabled,
    dsa: { api_url: '', api_auth: null, folder_id: '' },
    globus: {},
  });
  assert.equal(result.ready, false);
  assert.ok(result.blockers.includes('Configure a DSA server.'));
});

test('DSA readiness: url set but logged out', () => {
  const result = selectUploadReadiness({
    uploadRouting: baseUr,
    config: configBothEnabled,
    dsa: { api_url: 'https://example.org/api/v1', api_auth: null, folder_id: '' },
    globus: {},
  });
  assert.equal(result.ready, false);
  assert.ok(result.blockers.includes('Sign in to DSA.'));
  assert.ok(result.blockers.includes('Choose a DSA folder.'));
});

test('DSA readiness: logged in without folder', () => {
  const result = selectUploadReadiness({
    uploadRouting: baseUr,
    config: configBothEnabled,
    dsa: {
      api_url: 'https://example.org/api/v1',
      api_auth: { authToken: { token: 'x' } },
      folder_id: '',
    },
    globus: {},
  });
  assert.equal(result.ready, false);
  assert.ok(result.blockers.includes('Choose a DSA folder.'));
  assert.ok(!result.blockers.includes('Sign in to DSA.'));
});

test('DSA readiness: ready when auth and folder ok', () => {
  const result = selectUploadReadiness({
    uploadRouting: baseUr,
    config: configBothEnabled,
    dsa: {
      api_url: 'https://example.org/api/v1',
      api_auth: { authToken: { token: 'x' } },
      folder_id: 'abc',
      dsa_folder_exists: true,
    },
    globus: {},
  });
  assert.equal(result.ready, true);
  assert.deepEqual(result.blockers, []);
});

test('upload readiness: blocks when no methods enabled', () => {
  const result = selectUploadReadiness({
    uploadRouting: baseUr,
    config: {
      dsa_upload: { integrationEnabled: false },
      globus_upload: {},
    },
    dsa: {
      api_url: 'https://example.org/api/v1',
      api_auth: { authToken: { token: 'x' } },
      folder_id: 'abc',
    },
    globus: {},
  });
  assert.equal(result.ready, false);
  assert.ok(result.blockers.includes(UPLOAD_METHODS_DISABLED_MESSAGE));
});

test('upload readiness: blocks when destination method is disabled', () => {
  const result = selectUploadReadiness({
    uploadRouting: baseUr,
    config: {
      dsa_upload: { integrationEnabled: false },
      globus_upload: { integrationEnabled: true },
    },
    dsa: {
      api_url: 'https://example.org/api/v1',
      api_auth: { authToken: { token: 'x' } },
      folder_id: 'abc',
    },
    globus: {},
  });
  assert.equal(result.ready, false);
  assert.ok(result.blockers.some((b) => b.includes('DSA upload is disabled')));
});

test('globusParallelExceedsUploadQueue compares parallel to pending', () => {
  assert.equal(globusParallelExceedsUploadQueue({
    max_globus_parallel_uploads: 4,
    max_local_pending: 2,
  }), true);
  assert.equal(globusParallelExceedsUploadQueue({
    max_globus_parallel_uploads: 2,
    max_local_pending: 2,
  }), false);
  assert.equal(globusParallelExceedsUploadQueue({
    max_globus_parallel_uploads: 1,
    max_local_pending: 2,
  }), false);
});

test('Globus readiness: blocks when transfers exceed upload queue', () => {
  const result = selectUploadReadiness({
    uploadRouting: {
      auto_upload: true,
      destination: 'globus',
      max_globus_parallel_uploads: 4,
      max_local_pending: 2,
    },
    config: configBothEnabled,
    dsa: {},
    globus: readyGlobus,
  });
  assert.equal(result.ready, false);
  assert.ok(result.blockers.includes(GLOBUS_EXCEEDS_UPLOAD_QUEUE_MESSAGE));
});

test('Globus readiness: ready when transfers within upload queue', () => {
  const result = selectUploadReadiness({
    uploadRouting: {
      auto_upload: true,
      destination: 'globus',
      max_globus_parallel_uploads: 2,
      max_local_pending: 2,
    },
    config: configBothEnabled,
    dsa: {},
    globus: readyGlobus,
  });
  assert.equal(result.ready, true);
  assert.deepEqual(result.blockers, []);
});
