import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getCsvFieldAliases,
  normalizeCsvConfig,
  resolveCsvHeaderLink,
  stripDefaultFromAlternates,
  alternatesFromLegacyPickerValue,
  syncCsvLegacyColumnValue,
} from './csv_column_config.js';
import { getCsvTemplateHeaderList } from './csv_import_config.js';
import { isWsiExtension, WSI_SUPPORTED_EXTENSIONS } from './wsi_extensions.js';

test('isWsiExtension accepts unified extension set', () => {
  assert.equal(isWsiExtension('slide.svs'), true);
  assert.equal(isWsiExtension('slide.ndpi'), true);
  assert.equal(isWsiExtension('slide.tif'), true);
  assert.equal(isWsiExtension('slide.tiff'), true);
  assert.equal(isWsiExtension('slide.czi'), false);
  assert.equal(isWsiExtension('slide.jpg'), false);
  assert.deepEqual(WSI_SUPPORTED_EXTENSIONS.length, 4);
});

test('normalizeCsvConfig migrates legacy single-string columns to alternates', () => {
  const normalized = normalizeCsvConfig({
    file_path_column: 'file location',
    file_rename_column: 'rename',
  });
  assert.deepEqual(getCsvFieldAliases(normalized, 'filePath'), ['file location']);
  assert.deepEqual(getCsvFieldAliases(normalized, 'outputName'), ['rename']);
  assert.equal(normalized.file_path_column, 'file location');
  assert.equal(normalized.file_rename_column, 'rename');
});

test('normalizeCsvConfig strips default header from stored alternates', () => {
  const normalized = normalizeCsvConfig({
    reservedColumns: {
      filePath: { aliases: ['path', 'file location'] },
      outputName: { aliases: ['output_name'] },
      labelText: { aliases: [] },
      qrContent: { aliases: [] },
    },
  });
  assert.deepEqual(getCsvFieldAliases(normalized, 'filePath'), ['file location']);
  assert.deepEqual(getCsvFieldAliases(normalized, 'outputName'), []);
});

test('resolveCsvHeaderLink matches default header before alternates', () => {
  const headers = ['id', 'path', 'file location'];
  const link = resolveCsvHeaderLink(headers, {
    defaultHeader: 'path',
    alternates: ['file location'],
  });
  assert.deepEqual(link, { header: 'path', header_idx: 1 });
});

test('resolveCsvHeaderLink uses alternates when default missing', () => {
  const headers = ['id', 'file location', 'other'];
  const link = resolveCsvHeaderLink(headers, {
    defaultHeader: 'path',
    alternates: ['missing', 'file location'],
  });
  assert.deepEqual(link, { header: 'file location', header_idx: 1 });
});

test('resolveCsvHeaderLink supports legacy array-only call', () => {
  const headers = ['id', 'file location', 'path'];
  const link = resolveCsvHeaderLink(headers, ['missing', 'file location', 'path']);
  assert.deepEqual(link, { header: 'file location', header_idx: 1 });
});

test('resolveCsvHeaderLink returns null when no alias matches', () => {
  assert.equal(resolveCsvHeaderLink(['a', 'b'], { defaultHeader: 'c', alternates: ['d'] }), null);
});

test('getCsvTemplateHeaderList omits output folder from template', () => {
  const headers = getCsvTemplateHeaderList({});
  assert.deepEqual(headers, ['path', 'output_name', 'label', 'qr']);
});

test('syncCsvLegacyColumnValue uses first alternate or default header', () => {
  assert.equal(syncCsvLegacyColumnValue('outputName', []), 'output_name');
  assert.equal(syncCsvLegacyColumnValue('outputName', ['deid_name']), 'deid_name');
});

test('stripDefaultFromAlternates removes default header', () => {
  assert.deepEqual(stripDefaultFromAlternates(['path', 'loc'], 'path'), ['loc']);
});

test('alternatesFromLegacyPickerValue maps default to empty alternates', () => {
  assert.deepEqual(alternatesFromLegacyPickerValue('path', 'path'), []);
  assert.deepEqual(alternatesFromLegacyPickerValue('file location', 'path'), ['file location']);
});

test('normalizeCsvConfig does not inject legacy when reservedColumns exists', () => {
  const normalized = normalizeCsvConfig({
    file_path_column: 't',
    reservedColumns: {
      filePath: { aliases: ['testing'] },
      outputName: { aliases: [] },
      labelText: { aliases: [] },
      qrContent: { aliases: [] },
    },
  });
  assert.deepEqual(getCsvFieldAliases(normalized, 'filePath'), ['testing']);
});

test('normalizeCsvConfig still migrates legacy-only configs without reservedColumns', () => {
  const normalized = normalizeCsvConfig({
    file_path_column: 'file location',
  });
  assert.deepEqual(getCsvFieldAliases(normalized, 'filePath'), ['file location']);
  assert.equal(normalized.file_path_column, 'file location');
});
