import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { migrateConfigV3, normalizeLabelConfig, migrateAffixesToPattern, normalizeDsaUploadConfig, fontSizeFractionToUi, fontSizeUiToFraction, getEffectiveLabelWidth } from './computed_field_config.js';

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

  it('migrates rename + output_name to Same as file', () => {
    const config = migrateConfigV3({
      dsa_upload: {
        rename_item_after_upload: true,
        dsaAlias: { mode: 'output_name', pattern: '' },
      },
    });
    assert.equal(config.dsa_upload.rename_item_after_upload, false);
    assert.equal(config.dsa_upload.dsaAlias.mode, 'label_text');
  });

  it('migrates set_item_metadata true to all_deid', () => {
    const config = migrateConfigV3({
      dsa_upload: { set_item_metadata: true },
    });
    assert.equal(config.dsa_upload.itemMetadata.mode, 'all_deid');
    assert.equal(config.dsa_upload.set_item_metadata, undefined);
  });
});

describe('normalizeDsaUploadConfig', () => {
  it('keeps label_text rename enabled', () => {
    const dsa = normalizeDsaUploadConfig({
      rename_item_after_upload: true,
      dsaAlias: { mode: 'label_text', pattern: '' },
    });
    assert.equal(dsa.rename_item_after_upload, true);
    assert.equal(dsa.dsaAlias.mode, 'label_text');
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

  it('defaults font size to auto 0.15', () => {
    const label = normalizeLabelConfig({});
    assert.equal(label.fontSizeMode, 'auto');
    assert.equal(label.fontSize, 0.15);
  });

  it('clamps manual fontSize into range', () => {
    const high = normalizeLabelConfig({ fontSizeMode: 'manual', fontSize: 9 });
    assert.equal(high.fontSizeMode, 'manual');
    assert.equal(high.fontSize, 0.35);

    const low = normalizeLabelConfig({ fontSizeMode: 'manual', fontSize: 0 });
    assert.equal(low.fontSize, 0.01);
  });

  it('defaults and clamps labelWidth', () => {
    assert.equal(normalizeLabelConfig({}).labelWidth, 750);
    assert.equal(normalizeLabelConfig({}).customizeLabelWidth, false);
    assert.equal(normalizeLabelConfig({ labelWidth: 50 }).labelWidth, 100);
    assert.equal(normalizeLabelConfig({ labelWidth: 99999 }).labelWidth, 1500);
    assert.equal(normalizeLabelConfig({ labelWidth: 600.7 }).labelWidth, 601);
  });

  it('effective label width ignores custom value until customize is on', () => {
    assert.equal(getEffectiveLabelWidth({ labelWidth: 900 }), 750);
    assert.equal(getEffectiveLabelWidth({ customizeLabelWidth: true, labelWidth: 900 }), 900);
  });
});

describe('fontSize UI scale', () => {
  it('maps default fraction near mid-low of 1–100', () => {
    assert.equal(fontSizeFractionToUi(0.15), 42);
  });

  it('round-trips UI endpoints', () => {
    assert.equal(fontSizeFractionToUi(fontSizeUiToFraction(1)), 1);
    assert.equal(fontSizeFractionToUi(fontSizeUiToFraction(100)), 100);
  });

  it('clamps UI input', () => {
    assert.equal(fontSizeFractionToUi(fontSizeUiToFraction(0)), 1);
    assert.equal(fontSizeFractionToUi(fontSizeUiToFraction(999)), 100);
  });
});
