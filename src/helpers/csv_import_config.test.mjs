import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCsvTemplateRow,
  CSV_TEMPLATE_DEFAULT_HEADERS,
  getCsvTemplateHeaderList,
  getCsvTemplateHeaders,
} from './csv_import_config.js';

test('getCsvTemplateHeaders uses configured names with defaults for label and qr', () => {
  const headers = getCsvTemplateHeaders({
    file_path_column: 'file location',
    file_rename_column: 'deid_name',
    file_destination_directory_column: 'dest',
  });
  assert.equal(headers.filePath, 'file location');
  assert.equal(headers.outputFolder, 'dest');
  assert.equal(headers.outputName, 'deid_name');
  assert.equal(headers.label, CSV_TEMPLATE_DEFAULT_HEADERS.label);
  assert.equal(headers.qr, CSV_TEMPLATE_DEFAULT_HEADERS.qr);
});

test('getCsvTemplateHeaders falls back to defaults when mapping fields are blank', () => {
  const headers = getCsvTemplateHeaders({
    file_path_column: '  ',
    file_rename_column: '',
    file_destination_directory_column: null,
  });
  assert.deepEqual(headers, CSV_TEMPLATE_DEFAULT_HEADERS);
});

test('getCsvTemplateHeaderList returns five unique headers in order', () => {
  const list = getCsvTemplateHeaderList({});
  assert.deepEqual(list, [
    'path',
    'output_folder',
    'output_name',
    'label',
    'qr',
  ]);
});

test('buildCsvTemplateRow populates values from file row reserved fields', () => {
  const row = buildCsvTemplateRow({
    __reserved: {
      source: { path: '/slides/a.tiff' },
      destinationDirectory: '/out',
      rename: 'custom-name',
      labelText: 'Label A',
      qrPayload: 'qr-data',
    },
  }, {}, {
    resolveOutputBasename: () => 'should-not-be-used',
    config: {},
  });

  assert.equal(row.path, '/slides/a.tiff');
  assert.equal(row.output_folder, '/out');
  assert.equal(row.output_name, 'custom-name');
  assert.equal(row.label, 'Label A');
  assert.equal(row.qr, 'qr-data');
});

test('buildCsvTemplateRow uses resolveOutputBasename when rename is unset', () => {
  const row = buildCsvTemplateRow({
    __reserved: {
      source: { path: '/slides/a.tiff' },
    },
  }, {}, {
    resolveOutputBasename: () => 'resolved-stem',
    config: { filename: { source: 'uuid' } },
  });

  assert.equal(row.output_name, 'resolved-stem');
});

test('buildCsvTemplateRow returns empty row when no file row provided', () => {
  const row = buildCsvTemplateRow(null, {});
  assert.equal(row.path, '');
  assert.equal(row.output_folder, '');
  assert.equal(row.output_name, '');
  assert.equal(row.label, '');
  assert.equal(row.qr, '');
});
