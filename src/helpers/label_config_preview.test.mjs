import test from 'node:test';
import assert from 'node:assert/strict';
import { previewLabelStrings } from './label_config_preview.js';

const baseRow = {
  BlockId: 'B12',
  StainId: 'HE',
  Accession: 'DEMO_ACC',
  __reserved: { uuid: 'uuid-123', rename: 'human_name' },
};

const baseConfig = {
  filename: { use_uuid: true },
  naming: { accessionMode: 'manual', accessionToken: 'CASE42' },
  label: {
    add_text: true,
    add_qr: true,
    text_column_field: { value: 'rename', label: 'Renamed as' },
    qr_mode: { value: 'uuid', label: 'Encode UUID' },
    label_text_assembly: { mode: 'legacy', template: '', fieldsOrder: [], separator: '_' },
    qr_assembly: { mode: 'legacy', template: '', fieldsOrder: [], separator: '' },
  },
};

test('previewLabelStrings legacy single column label text', () => {
  const { labelText } = previewLabelStrings(baseConfig, baseRow);
  assert.equal(labelText, 'human_name');
});

test('previewLabelStrings legacy QR uuid mode', () => {
  const { qrPayload } = previewLabelStrings(baseConfig, baseRow);
  assert.equal(qrPayload, 'uuid-123');
});

test('previewLabelStrings fields assembly with deidToken', () => {
  const config = {
    ...baseConfig,
    label: {
      ...baseConfig.label,
      label_text_assembly: {
        mode: 'fields',
        fieldsOrder: ['deidToken', 'BlockId'],
        separator: '_',
        template: '',
      },
    },
  };
  const { labelText } = previewLabelStrings(config, baseRow);
  assert.equal(labelText, 'CASE42_B12');
});

test('previewLabelStrings template with deidToken', () => {
  const config = {
    ...baseConfig,
    label: {
      ...baseConfig.label,
      label_text_assembly: {
        mode: 'template',
        template: '{deidToken}_{field:StainId}',
        fieldsOrder: [],
        separator: '_',
      },
    },
  };
  const { labelText } = previewLabelStrings(config, baseRow);
  assert.equal(labelText, 'CASE42_HE');
});

test('previewLabelStrings warns when using sample row', () => {
  const { warnings } = previewLabelStrings(baseConfig, baseRow, { usingSample: true });
  assert.ok(warnings.some((w) => w.includes('sample')));
});
