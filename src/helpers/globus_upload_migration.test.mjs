import test from 'node:test';
import assert from 'node:assert/strict';

import { migrateGlobusUploadConfig } from './globus_upload_migration.js';

test('migrates remembered endpoint into config default', () => {
  const r = migrateGlobusUploadConfig(null, {
    remember_target_endpoint: true,
    saved_target_endpoint_id: 'aaaa',
    saved_target_endpoint_label: 'Lab DTN',
    target_endpoint_id: 'bbbb',
    source_endpoint: 'src-uuid',
    disable_ssl_verification: true,
  });
  assert.equal(r.default_target_endpoint_id, 'aaaa');
  assert.equal(r.default_target_endpoint_label, 'Lab DTN');
  assert.equal(r.source_endpoint, 'src-uuid');
  assert.equal(r.disable_ssl_verification, true);
});

test('migrates live target when remember off', () => {
  const r = migrateGlobusUploadConfig({}, {
    remember_target_endpoint: false,
    target_endpoint_id: 'live-id',
    target_endpoint_label: 'Live',
  });
  assert.equal(r.default_target_endpoint_id, 'live-id');
  assert.equal(r.default_target_endpoint_label, 'Live');
});

test('keeps existing config defaults', () => {
  const r = migrateGlobusUploadConfig(
    {
      default_target_endpoint_id: 'cfg',
      default_target_endpoint_label: 'Config',
      source_endpoint: 'cfg-src',
      disable_ssl_verification: false,
    },
    {
      target_endpoint_id: 'other',
      source_endpoint: 'other-src',
      disable_ssl_verification: true,
    },
  );
  assert.equal(r.default_target_endpoint_id, 'cfg');
  assert.equal(r.source_endpoint, 'cfg-src');
  assert.equal(r.disable_ssl_verification, false);
});
