import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildEsmStagingColumnDefs } from './esm_staging_column_defs.js';
import { makeEsmProfile, ESM_OUTPUT_NAME_TARGET } from './esm_profile_helpers.js';

describe('buildEsmStagingColumnDefs', () => {
  it('includes base slide columns plus enabled mapping columns', () => {
    const profile = makeEsmProfile({
      outputNameMapping: { enabled: true, pattern: '{blockId}' },
      extraColumnMappings: [
        { id: '1', enabled: true, targetColumn: 'Assembly', pattern: '{stainId}' },
      ],
    });
    const cols = buildEsmStagingColumnDefs(profile);
    assert.ok(cols.some((c) => c.field === 'BlockId'));
    assert.ok(cols.some((c) => c.headerName === 'Output name'));
    assert.ok(cols.some((c) => c.colId === 'Assembly'));
  });

  it('omits disabled mappings', () => {
    const profile = makeEsmProfile({
      extraColumnMappings: [
        { id: '1', enabled: false, targetColumn: 'Assembly', pattern: '{stainId}' },
      ],
    });
    const cols = buildEsmStagingColumnDefs(profile);
    assert.ok(!cols.some((c) => c.colId === 'Assembly'));
  });

  it('valueGetter resolves preview mapping values', () => {
    const profile = makeEsmProfile({
      outputNameMapping: { enabled: true, pattern: '{deid}_{blockId}' },
    });
    const cols = buildEsmStagingColumnDefs(profile);
    const outputCol = cols.find((c) => c.colId === ESM_OUTPUT_NAME_TARGET);
    const row = {
      __raw: { BlockId: 'A1', BarcodeId: 'ACC-1' },
      __esm: { criteriaRow: { deid: 'CASE01' } },
    };
    assert.equal(outputCol.valueGetter({ data: row }), 'CASE01_A1');
  });

  it('applies shared column sizing profile to base and mapping columns', () => {
    const profile = makeEsmProfile({
      outputNameMapping: { enabled: true, pattern: '{blockId}' },
      extraColumnMappings: [
        { id: '1', enabled: true, targetColumn: 'Assembly', pattern: '{stainId}' },
      ],
    });
    const cols = buildEsmStagingColumnDefs(profile);

    const blockCol = cols.find((c) => c.field === 'BlockId');
    assert.equal(blockCol.minWidth, 76);
    assert.equal(blockCol.flex, 0);

    const pathCol = cols.find((c) => c.field === 'CompressedFileLocation');
    assert.equal(pathCol.flex, 1);
    assert.equal(pathCol.minWidth, 140);

    const outputCol = cols.find((c) => c.colId === ESM_OUTPUT_NAME_TARGET);
    assert.equal(outputCol.minWidth, 140);
    assert.equal(outputCol.flex, 2);

    const assemblyCol = cols.find((c) => c.colId === 'Assembly');
    assert.equal(assemblyCol.minWidth, 100);
    assert.equal(assemblyCol.flex, 1);
  });
});
