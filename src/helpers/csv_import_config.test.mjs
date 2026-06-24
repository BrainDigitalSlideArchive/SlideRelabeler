import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCsvTemplateRow,
  CSV_TEMPLATE_DEFAULT_HEADERS,
  getCsvTemplateHeaderList,
  getCsvTemplateHeaders,
} from './csv_import_config.js';

test('getCsvTemplateHeaders always returns default header names', () => {
  const headers = getCsvTemplateHeaders({});
  assert.equal(headers.filePath, CSV_TEMPLATE_DEFAULT_HEADERS.filePath);
  assert.equal(headers.outputName, CSV_TEMPLATE_DEFAULT_HEADERS.outputName);
  assert.equal(headers.label, CSV_TEMPLATE_DEFAULT_HEADERS.label);
  assert.equal(headers.qr, CSV_TEMPLATE_DEFAULT_HEADERS.qr);
});

test('getCsvTemplateHeaders ignores legacy columns and alternates', () => {
  const headers = getCsvTemplateHeaders({
    file_path_column: 'file',
    file_rename_column: 'deid_name',
    reservedColumns: {
      filePath: { aliases: ['file', 'file location'] },
      outputName: { aliases: ['deid_name'] },
      labelText: { aliases: ['slide_label'] },
      qrContent: { aliases: ['qr_code'] },
    },
  });
  assert.equal(headers.filePath, 'path');
  assert.equal(headers.outputName, 'output_name');
  assert.equal(headers.label, 'label');
  assert.equal(headers.qr, 'qr');
});

test('getCsvTemplateHeaderList returns four default headers in order', () => {
  const list = getCsvTemplateHeaderList({});
  assert.deepEqual(list, ['path', 'output_name', 'label', 'qr']);
});

test('buildCsvTemplateRow populates values from file row reserved fields', () => {
  const row = buildCsvTemplateRow({
    __reserved: {
      source: { path: '/slides/a.tiff' },
      rename: 'custom-name',
      labelText: 'Label A',
      qrPayload: 'qr-data',
    },
  }, {}, {
    resolveOutputBasename: () => 'should-not-be-used',
    config: {},
  });

  assert.equal(row.path, '/slides/a.tiff');
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
  assert.equal(row.output_name, '');
  assert.equal(row.label, '');
  assert.equal(row.qr, '');
});
