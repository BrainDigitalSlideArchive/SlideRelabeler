import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_AUDIT_EXPORT_COLUMNS,
  entriesToCsvData,
  BATCH_EXPORT_COLUMNS,
} from './audit_log_export.js';

test('entriesToCsvData builds header and row objects from entries', () => {
  const { header, rows } = entriesToCsvData([
    {
      timestamp: '2026-06-01T10:00:00.000Z',
      type: 'slide_processed',
      status: 'success',
      batchId: 'RUN1',
      sourcePath: '/in/a.svs',
      outputPath: '/out/a.svs',
      outputName: 'A1',
      destination: '/out',
      uuid: 'uuid-1',
      labelText: 'Label',
      qrPayload: 'qr',
      dsaAlias: 'alias',
      errorMessage: '',
      runId: 'run-1',
    },
  ]);

  assert.deepEqual(header, DEFAULT_AUDIT_EXPORT_COLUMNS.map((c) => c.header));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].path, '/in/a.svs');
  assert.equal(rows[0].output_name, 'A1');
  assert.equal(rows[0].batch_id, 'RUN1');
  assert.equal(rows[0].runId, 'run-1');
});

test('entriesToCsvData exports batch rows with batch columns', () => {
  const { header, rows } = entriesToCsvData([
    {
      batchId: 'A1B2C3D4',
      runId: 'run-1',
      status: 'success',
      totalCount: 4,
      successCount: 4,
      errorCount: 0,
      startedAt: '2026-06-01T10:00:00.000Z',
      completedAt: '2026-06-01T10:05:00.000Z',
    },
  ], { columns: BATCH_EXPORT_COLUMNS });

  assert.deepEqual(header, BATCH_EXPORT_COLUMNS.map((c) => c.header));
  assert.equal(rows[0].batch_id, 'A1B2C3D4');
  assert.equal(rows[0].succeeded, '4');
  assert.equal(rows[0].failed, '0');
});

test('entriesToCsvData returns empty rows for empty input', () => {
  const { header, rows } = entriesToCsvData([]);
  assert.ok(header.length > 0);
  assert.deepEqual(rows, []);
});
