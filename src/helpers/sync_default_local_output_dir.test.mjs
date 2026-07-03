import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSeedOutputDirPayload,
  shouldSeedSessionOutputDir,
} from './sync_default_local_output_dir.js';

describe('shouldSeedSessionOutputDir', () => {
  it('returns false when config default is empty', () => {
    assert.equal(shouldSeedSessionOutputDir(null, ''), false);
    assert.equal(shouldSeedSessionOutputDir('/session', ''), false);
  });

  it('returns true when session output_dir is empty and default is set', () => {
    assert.equal(shouldSeedSessionOutputDir(null, '/default/out'), true);
    assert.equal(shouldSeedSessionOutputDir('', '/default/out'), true);
    assert.equal(shouldSeedSessionOutputDir('   ', '/default/out'), true);
  });

  it('returns false when session output_dir is already set', () => {
    assert.equal(shouldSeedSessionOutputDir('/session/out', '/default/out'), false);
  });
});

describe('buildSeedOutputDirPayload', () => {
  it('builds default_only SET_OUTPUT_DIR payload', () => {
    assert.deepEqual(buildSeedOutputDirPayload('/default/out'), {
      folder: '/default/out',
      mode: 'default_only',
    });
  });

  it('trims whitespace from default path', () => {
    assert.deepEqual(buildSeedOutputDirPayload('  /default/out  '), {
      folder: '/default/out',
      mode: 'default_only',
    });
  });
});
