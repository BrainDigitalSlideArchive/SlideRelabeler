import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { pickProcessedOutputPath } from './process_output_path.js';

describe('pickProcessedOutputPath', () => {
  it('prefers process response output_path when present', () => {
    assert.equal(
      pickProcessedOutputPath('/out/a.tif', { output_path: '/out/a.tiff' }),
      '/out/a.tiff',
    );
  });

  it('falls back to predicted path when response path missing', () => {
    assert.equal(pickProcessedOutputPath('/out/a.tif', {}), '/out/a.tif');
    assert.equal(pickProcessedOutputPath('/out/a.tif', null), '/out/a.tif');
    assert.equal(
      pickProcessedOutputPath('/out/a.tif', { output_path: '  ' }),
      '/out/a.tif',
    );
  });
});
