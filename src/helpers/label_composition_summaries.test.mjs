import test from 'node:test';
import assert from 'node:assert/strict';
import {
  describeTextConfig,
  describeQrConfig,
  describeIconConfig,
  truncate,
} from './label_composition_summaries.js';

test('describeTextConfig shows mode not preview', () => {
  const labelConfig = { textDefault: 'output_name' };
  assert.equal(describeTextConfig(labelConfig), 'Output name when empty');
});

test('describeTextConfig none default', () => {
  const labelConfig = { textDefault: 'none' };
  assert.equal(describeTextConfig(labelConfig), 'Blank when empty');
});

test('describeTextConfig custom pattern', () => {
  const labelConfig = {
    labelText: { mode: 'pattern', pattern: '{outputName}_{uuid}' },
    textDefault: 'pattern',
  };
  assert.equal(describeTextConfig(labelConfig), 'Custom: {outputName}_{uuid}');
});

test('describeQrConfig output_name default', () => {
  const labelConfig = { qrDefault: 'output_name' };
  assert.equal(describeQrConfig(labelConfig), 'Output name when empty');
});

test('describeQrConfig pattern without pattern string', () => {
  const labelConfig = { qrDefault: 'pattern' };
  assert.equal(describeQrConfig(labelConfig), 'Custom pattern when empty');
});

test('describeQrConfig custom pattern string', () => {
  const labelConfig = {
    qrDefault: 'pattern',
    qrContent: { mode: 'pattern', pattern: 'https://example.org?id={uuid}' },
    qrPattern: 'https://example.org?id={uuid}',
  };
  assert.equal(describeQrConfig(labelConfig), 'Custom: https://example.org?id={uuid}');
});

test('describeIconConfig', () => {
  assert.equal(describeIconConfig('/path/to/logo.png'), 'logo.png');
  assert.equal(describeIconConfig(null), 'Not set');
});

test('truncate', () => {
  assert.equal(truncate('abcdefghij', 5), 'abcde…');
});
