import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAssembledName,
  applyAssemblyAndRouting,
  DEFAULT_ASSEMBLY,
  DEFAULT_ROUTING,
} from './assembly_routing.js';
import { migrateConfigV2 } from './config_v2_migration.js';

describe('buildAssembledName', () => {
  it('joins specimen id, block, stain, slide with separator', () => {
    const row = { Accession: 'CASE42', BlockId: 'B12', StainId: 'HE', SlideNum: '1' };
    const name = buildAssembledName(row, DEFAULT_ASSEMBLY);
    assert.equal(name, 'CASE42_B12_HE_1');
  });

  it('uses criteria deid for specimen id when present', () => {
    const row = { BlockId: 'B1', StainId: 'PAS' };
    const name = buildAssembledName(row, DEFAULT_ASSEMBLY, { criteriaDeid: 'DEID_99' });
    assert.equal(name, 'DEID_99_B1_PAS');
  });
});

describe('applyAssemblyAndRouting', () => {
  it('sets AssembledName column and routing fields', () => {
    const config = {
      assembly: DEFAULT_ASSEMBLY,
      filename: { source: 'computed' },
      routing: { ...DEFAULT_ROUTING, labelText: { enabled: true, column: 'AssembledName' } },
      label: { text_column_field: { value: 'AssembledName' }, label_text_assembly: { mode: 'legacy' } },
    };
    const row = {
      Accession: 'A1',
      BlockId: 'B2',
      StainId: 'HE',
      SlideNum: '3',
      __reserved: { uuid: 'u1' },
    };
    const out = applyAssemblyAndRouting(row, config);
    assert.equal(out.AssembledName, 'A1_B2_HE_3');
    assert.equal(out.__reserved.rename, 'A1_B2_HE_3');
    assert.equal(out.__reserved.labelText, 'A1_B2_HE_3');
    assert.equal(out.__reserved.assembledName, 'A1_B2_HE_3');
  });

  it('does not overwrite rename when filename source is column', () => {
    const config = {
      assembly: DEFAULT_ASSEMBLY,
      filename: { source: 'column', column: 'output_name' },
      routing: DEFAULT_ROUTING,
    };
    const row = {
      output_name: 'CSV_NAME',
      Accession: 'A1',
      BlockId: 'B2',
      __reserved: { uuid: 'u1', rename: 'KEEP_ME' },
    };
    const out = applyAssemblyAndRouting(row, config);
    assert.equal(out.__reserved.rename, 'KEEP_ME');
    assert.equal(out.AssembledName, 'A1_B2');
  });
});

describe('migrateConfigV2', () => {
  it('maps legacy naming and esm mapping into assembly', () => {
    const { config, wasReset } = migrateConfigV2(
      { filename: { use_uuid: false }, naming: { accessionMode: 'manual', accessionToken: 'TOK' } },
      { mappingConfig: { fieldsOrder: ['Accession', 'BlockId'], duplicateStrategy: 'skip-duplicates' } },
    );
    assert.equal(wasReset, true);
    assert.equal(config.configVersion, 2);
    assert.equal(config.assembly.specimenId.source, 'fixed');
    assert.equal(config.assembly.specimenId.fixedValue, 'TOK');
    assert.deepEqual(config.assembly.fieldsOrder, ['specimenId', 'BlockId']);
    assert.equal(config.filename.source, 'computed');
  });

  it('maps csv rename column to column filename source', () => {
    const { config } = migrateConfigV2(
      { filename: { use_uuid: false }, csv: { file_rename_column: 'output_name' } },
      {},
    );
    assert.equal(config.filename.source, 'column');
    assert.equal(config.filename.column, 'output_name');
  });
});
