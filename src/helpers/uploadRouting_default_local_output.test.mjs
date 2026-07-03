import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { migrateUploadRoutingFromLegacy } from './uploadRouting_migration.js';

describe('uploadRouting default_local_output_dir persistence', () => {
  it('migrates saved default_local_output_dir from uploadRouting blob', () => {
    const migrated = migrateUploadRoutingFromLegacy(null, null, {
      auto_upload: false,
      default_local_output_dir: '/saved/default',
    });
    assert.equal(migrated.default_local_output_dir, '/saved/default');
  });

  it('defaults default_local_output_dir to empty for legacy stores', () => {
    const migrated = migrateUploadRoutingFromLegacy({ upload: true }, null, null);
    assert.equal(migrated.default_local_output_dir, '');
  });

  it('round-trips default_local_output_dir through migration shape', () => {
    const saved = {
      auto_upload: true,
      local_output_enabled: true,
      staging_dir_mode: 'custom',
      staging_dir_custom: '/staging',
      max_local_pending: 3,
      max_globus_parallel_uploads: 2,
      destination: 'globus',
      default_local_output_dir: '/config/default',
    };
    const migrated = migrateUploadRoutingFromLegacy(null, null, saved);
    assert.equal(migrated.default_local_output_dir, '/config/default');
    assert.equal(migrated.staging_dir_custom, '/staging');
    assert.equal(migrated.destination, 'globus');
  });
});
