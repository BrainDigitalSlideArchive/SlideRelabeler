import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildEsmFieldTransforms } from './esm_transform_cell.js';

describe('buildEsmFieldTransforms', () => {
  const rule = {
    id: 'r1',
    name: 'Normalize H&E',
    enabled: true,
    steps: [{ find: 'Initial H&E', replace: 'H&E', matchMode: 'all', caseSensitive: true }],
  };

  it('builds transformed values and provenance for changed fields', () => {
    const { values, transforms } = buildEsmFieldTransforms(
      { StainId: 'Initial H&E', BlockId: 'A1', SlideNum: 1 },
      [rule],
    );

    assert.equal(values.StainId, 'H&E');
    assert.equal(values.BlockId, 'A1');
    assert.equal(values.SlideNum, '1');
    assert.equal(transforms.StainId.original, 'Initial H&E');
    assert.equal(transforms.StainId.appliedRules[0].name, 'Normalize H&E');
    assert.equal(transforms.BlockId, undefined);
  });

  it('omits transforms when no rules change values', () => {
    const { values, transforms } = buildEsmFieldTransforms(
      { StainId: 'Plain', BlockId: 'A1' },
      [rule],
    );

    assert.equal(values.StainId, 'Plain');
    assert.equal(transforms, undefined);
  });
});
