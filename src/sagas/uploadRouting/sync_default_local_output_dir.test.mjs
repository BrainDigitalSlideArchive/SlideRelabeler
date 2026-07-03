import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { maybeSeedSessionOutputDir } from './sync_default_local_output_dir.js';
import * as files_actions from '../../actions/files.js';

describe('maybeSeedSessionOutputDir', () => {
  it('dispatches SET_OUTPUT_DIR when session dir is empty and config default is set', () => {
    const gen = maybeSeedSessionOutputDir();
    gen.next();
    gen.next(null);
    const result = gen.next('/config/default');
    assert.equal(result.done, false);
    assert.equal(result.value.payload.action.type, files_actions.SET_OUTPUT_DIR);
    assert.deepEqual(result.value.payload.action.payload, {
      folder: '/config/default',
      mode: 'default_only',
    });
    assert.equal(gen.next().done, true);
  });

  it('does not dispatch when session output_dir is already set', () => {
    const gen = maybeSeedSessionOutputDir();
    gen.next();
    gen.next('/session/out');
    const result = gen.next('/config/default');
    assert.equal(result.done, true);
  });

  it('does not dispatch when config default is empty', () => {
    const gen = maybeSeedSessionOutputDir();
    gen.next();
    gen.next(null);
    const result = gen.next('');
    assert.equal(result.done, true);
  });
});
