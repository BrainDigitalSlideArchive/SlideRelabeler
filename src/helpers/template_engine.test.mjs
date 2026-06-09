import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateTemplate, assembleFromFields } from './template_engine.js';

const exampleRow = {
  BlockId: 'B12',
  StainId: 'HE',
  __reserved: { uuid: 'uuid-123', rename: 'human_name' },
};

test('evaluateTemplate substitutes placeholders', () => {
  const out = evaluateTemplate(
    exampleRow,
    '{deidToken}_{field:BlockId}',
    { deidToken: 'CASE42' },
  );
  assert.equal(out, 'CASE42_B12');
});

test('evaluateTemplate empty template returns empty', () => {
  assert.equal(evaluateTemplate(exampleRow, '', {}), '');
});

test('assembleFromFields joins ordered fields', () => {
  const out = assembleFromFields(
    exampleRow,
    ['deidToken', 'BlockId', 'StainId'],
    '_',
    { deidToken: 'T1' },
  );
  assert.equal(out, 'T1_B12_HE');
});
