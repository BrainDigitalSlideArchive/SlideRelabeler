import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { migrateConfigV3, normalizeLabelConfig, migrateAffixesToPattern } from './computed_field_config.js';

describe('migrateAffixesToPattern', () => {
  it('folds uuid prefix into pattern', () => {
    const filename = migrateAffixesToPattern({
      source: 'uuid',
      use_prefix: true,
      prefix: 'deid_',
    });
    assert.equal(filename.source, 'pattern');
    assert.equal(filename.pattern, 'deid_{uuid}');
    assert.equal(filename.use_prefix, false);
  });

  it('folds original suffix into pattern', () => {
    const filename = migrateAffixesToPattern({
      source: 'original',
      use_suffix: true,
      suffix: '_deid',
    });
    assert.equal(filename.pattern, '{originalBasename}_deid');
  });

  it('wraps existing pattern with both affixes', () => {
    const filename = migrateAffixesToPattern({
      source: 'pattern',
      pattern: '{blockId}',
      use_prefix: true,
      prefix: 'p_',
      use_suffix: true,
      suffix: '_s',
    });
    assert.equal(filename.pattern, 'p_{blockId}_s');
  });

  it('folds column source into field token with affixes', () => {
    const filename = migrateAffixesToPattern({
      source: 'column',
      column: 'output_name',
      use_prefix: true,
      prefix: 'deid_',
    });
    assert.equal(filename.source, 'pattern');
    assert.equal(filename.pattern, 'deid_{field:output_name}');
  });
});

describe('migrateConfigV3', () => {
  it('migrates legacy affixes on config load', () => {
    const config = migrateConfigV3({
      filename: { source: 'uuid', use_prefix: true, prefix: 'deid_' },
    });
    assert.equal(config.filename.source, 'pattern');
    assert.equal(config.filename.pattern, 'deid_{uuid}');
  });

  it('maps legacy textDefault and qrPattern into labelText and qrContent', () => {
    const config = migrateConfigV3({
      configVersion: 2,
      label: {
        textDefault: 'none',
        qrDefault: 'pattern',
        qrPattern: '{outputName}',
      },
      filename: { source: 'column', column: 'Block ID' },
    });

    assert.equal(config.label.labelText.mode, 'none');
    assert.equal(config.label.qrContent.mode, 'pattern');
    assert.equal(config.label.qrContent.pattern, '{outputName}');
    assert.equal(config.filename.source, 'pattern');
    assert.equal(config.filename.pattern, '{field:Block ID}');
    assert.equal(config.configVersion, 3);
  });

  it('maps legacy DSA item_name_assembly template to dsaAlias pattern', () => {
    const config = migrateConfigV3({
      dsa_upload: {
        item_name_assembly: { mode: 'template', template: '{labelText}' },
      },
    });

    assert.equal(config.dsa_upload.dsaAlias.mode, 'pattern');
    assert.equal(config.dsa_upload.dsaAlias.pattern, '{labelText}');
  });
});

describe('normalizeLabelConfig', () => {
  it('keeps legacy shims in sync with new specs', () => {
    const label = normalizeLabelConfig({
      labelText: { mode: 'pattern', pattern: '{uuid}' },
      qrContent: { mode: 'uuid', pattern: '' },
    });

    assert.equal(label.textDefault, 'pattern');
    assert.equal(label.qrDefault, 'uuid');
  });
});
