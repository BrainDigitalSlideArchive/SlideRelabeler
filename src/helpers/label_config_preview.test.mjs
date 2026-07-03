import test from 'node:test';
import assert from 'node:assert/strict';
import {
  previewLabelStrings,
  describePreviewTextProvenance,
  describePreviewQrProvenance,
  getLabelSchematicTemplates,
} from './label_config_preview.js';
import { NAMING_SOURCE } from './row_naming_defaults.js';

const baseRow = {
  __reserved: {
    uuid: 'uuid-123',
    rename: 'human_name',
    labelText: 'human_name',
    qrPayload: 'uuid-123',
    labelTextSource: NAMING_SOURCE.USER,
    qrPayloadSource: NAMING_SOURCE.USER,
  },
};

const baseConfig = {
  filename: { source: 'uuid' },
  label: {
    textDefault: 'output_name',
    qrDefault: 'uuid',
    qrPattern: '',
  },
};

test('previewLabelStrings uses stored row columns', () => {
  const { labelText, qrPayload } = previewLabelStrings(baseConfig, baseRow);
  assert.equal(labelText, 'human_name');
  assert.equal(qrPayload, 'uuid-123');
});

test('previewLabelStrings applies defaults when row values missing', () => {
  const row = { __reserved: { uuid: 'uuid-123' } };
  const { labelText, qrPayload } = previewLabelStrings(baseConfig, row);
  assert.equal(labelText, 'uuid-123');
  assert.equal(qrPayload, 'uuid-123');
});

test('previewLabelStrings label none default', () => {
  const config = {
    ...baseConfig,
    label: { ...baseConfig.label, textDefault: 'none', qrDefault: 'output_name' },
  };
  const row = { __reserved: { uuid: 'uuid-123' } };
  const { labelText, qrPayload } = previewLabelStrings(config, row);
  assert.equal(labelText, '');
  assert.equal(qrPayload, 'uuid-123');
});

test('previewLabelStrings live provenance default vs table', () => {
  const defaultRow = { __reserved: { uuid: 'uuid-123', labelTextSource: NAMING_SOURCE.DEFAULT, qrPayloadSource: NAMING_SOURCE.DEFAULT } };
  const fromTable = previewLabelStrings(baseConfig, baseRow);
  const fromDefault = previewLabelStrings(baseConfig, defaultRow);

  assert.match(fromTable.labelTextProvenance, /from table/);
  assert.match(fromTable.qrPayloadProvenance, /from table/);
  assert.match(fromDefault.labelTextProvenance, /column empty/);
  assert.match(fromDefault.labelTextProvenance, /Output name/);
  assert.match(fromDefault.qrPayloadProvenance, /column empty/);
  assert.match(fromDefault.qrPayloadProvenance, /UUID/);
});

test('describePreviewTextProvenance sample mode', () => {
  const row = { __reserved: { uuid: 'acde070d-8c4c-4f0d-9d8a-162843c10333' } };
  const note = describePreviewTextProvenance(baseConfig, row, { usingSample: true });
  assert.match(note, /Sample row/);
  assert.match(note, /acde070d/);
  assert.match(note, /Label default: Output name/);
});

test('describePreviewQrProvenance sample mode with pattern', () => {
  const config = {
    ...baseConfig,
    label: {
      ...baseConfig.label,
      qrContent: { mode: 'pattern', pattern: 'https://example.org?id={uuid}' },
    },
  };
  const row = { __reserved: { uuid: 'uuid-123' } };
  const note = describePreviewQrProvenance(config, row, { usingSample: true });
  assert.match(note, /Sample row/);
  assert.match(note, /QR default: Custom pattern/);
});

test('previewLabelStrings does not warn for sample row alone', () => {
  const { warnings } = previewLabelStrings(baseConfig, baseRow, { usingSample: true });
  assert.ok(!warnings.some((w) => w.includes('sample')));
});

test('previewLabelStrings warns when image enabled without file', () => {
  const config = {
    ...baseConfig,
    label: {
      ...baseConfig.label,
      add_icon: true,
      icon_file: null,
    },
  };
  const { warnings, issues } = previewLabelStrings(config, baseRow);
  assert.ok(warnings.some((w) => w.includes('No image selected')));
  assert.equal(issues.length, 1);
  assert.equal(issues[0].feature, 'icon');
});

test('previewLabelStrings warns when QR pattern mode has empty pattern', () => {
  const config = {
    ...baseConfig,
    label: {
      ...baseConfig.label,
      add_qr: true,
      qrContent: { mode: 'pattern', pattern: '' },
      qrDefault: 'pattern',
      qrPattern: '',
    },
  };
  const row = { __reserved: { uuid: 'uuid-123' } };
  const { warnings, issues } = previewLabelStrings(config, row);
  assert.ok(warnings.some((w) => w.includes('pattern is empty')));
  assert.equal(issues[0].feature, 'qr');
});

test('previewLabelStrings warns when QR enabled but payload empty', () => {
  const config = {
    ...baseConfig,
    label: {
      ...baseConfig.label,
      add_qr: true,
      qrDefault: 'output_name',
    },
  };
  const row = { __reserved: { uuid: 'uuid-123', qrPayload: '' } };
  const { warnings, issues } = previewLabelStrings(config, row);
  assert.ok(warnings.some((w) => w.includes('no QR content')));
  assert.equal(issues[0].feature, 'qr');
});

test('getLabelSchematicTemplates shows mode placeholders not resolved values', () => {
  const config = {
    label: {
      textDefault: 'output_name',
      qrDefault: 'pattern',
      qrContent: { mode: 'pattern', pattern: 'https://{uuid}' },
      labelText: { mode: 'pattern', pattern: 'slide-{outputName}' },
    },
  };
  const templates = getLabelSchematicTemplates(config.label);
  assert.equal(templates.labelText, 'slide-{outputName}');
  assert.equal(templates.qrPayload, 'https://{uuid}');
});

test('getLabelSchematicTemplates uses built-in tokens for standard modes', () => {
  const templates = getLabelSchematicTemplates({
    textDefault: 'none',
    qrDefault: 'label_text',
  });
  assert.equal(templates.labelText, '(blank)');
  assert.equal(templates.qrPayload, '{labelText}');
});
