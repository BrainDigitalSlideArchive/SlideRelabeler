import test from 'node:test';
import assert from 'node:assert/strict';

import { AUDIT_STATUS } from './audit_log.js';
import {
  AUDIT_VIEW_SLIDE_TYPES,
  AUDIT_VIEW_UPLOAD_TYPES,
  deriveBatchRows,
  filterEntriesByTypes,
  formatBatchId,
  resolveAuditEntryIdsToDelete,
} from './audit_log_views.js';

test('formatBatchId returns first 8 hex chars uppercased', () => {
  assert.equal(formatBatchId('a1b2c3d4-e5f6-7890-abcd-ef1234567890'), 'A1B2C3D4');
  assert.equal(formatBatchId(''), '');
  assert.equal(formatBatchId(null), '');
});

test('filterEntriesByTypes keeps only matching audit types', () => {
  const entries = [
    { id: '1', type: 'batch_start' },
    { id: '2', type: 'slide_processed' },
    { id: '3', type: 'upload_complete' },
    { id: '4', type: 'slide_error' },
  ];
  assert.deepEqual(
    filterEntriesByTypes(entries, AUDIT_VIEW_SLIDE_TYPES).map((e) => e.id),
    ['2', '4'],
  );
  assert.deepEqual(
    filterEntriesByTypes(entries, AUDIT_VIEW_UPLOAD_TYPES).map((e) => e.id),
    ['3'],
  );
});

test('deriveBatchRows shows pending batch without complete entry', () => {
  const rows = deriveBatchRows([
    {
      id: 'start-1',
      type: 'batch_start',
      runId: 'run-pending',
      timestamp: '2026-06-08T12:00:00.000Z',
      status: AUDIT_STATUS.PENDING,
      summary: { fileCount: 5 },
      sequence: 1,
    },
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].batchId, formatBatchId('run-pending'));
  assert.equal(rows[0].status, AUDIT_STATUS.PENDING);
  assert.equal(rows[0].fileCount, 5);
  assert.equal(rows[0].successCount, null);
  assert.equal(rows[0].completedAt, null);
});

test('deriveBatchRows consolidates start and complete with counts', () => {
  const rows = deriveBatchRows([
    {
      id: 'start-1',
      type: 'batch_start',
      runId: 'run-done',
      timestamp: '2026-06-08T12:00:00.000Z',
      status: AUDIT_STATUS.PENDING,
      summary: { fileCount: 4 },
      sequence: 1,
    },
    {
      id: 'complete-1',
      type: 'batch_complete',
      runId: 'run-done',
      timestamp: '2026-06-08T12:05:00.000Z',
      status: AUDIT_STATUS.SUCCESS,
      summary: { successCount: 3, errorCount: 1, totalCount: 4 },
      sequence: 5,
    },
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].status, AUDIT_STATUS.SUCCESS);
  assert.equal(rows[0].successCount, 3);
  assert.equal(rows[0].errorCount, 1);
  assert.equal(rows[0].totalCount, 4);
  assert.equal(rows[0].startedAt, '2026-06-08T12:00:00.000Z');
  assert.equal(rows[0].completedAt, '2026-06-08T12:05:00.000Z');
});

test('deriveBatchRows marks all-failed batch as error', () => {
  const rows = deriveBatchRows([
    {
      id: 'start-1',
      type: 'batch_start',
      runId: 'run-fail',
      timestamp: '2026-06-08T12:00:00.000Z',
      summary: { fileCount: 2 },
      sequence: 1,
    },
    {
      id: 'complete-1',
      type: 'batch_complete',
      runId: 'run-fail',
      timestamp: '2026-06-08T12:02:00.000Z',
      summary: { successCount: 0, errorCount: 2, totalCount: 2 },
      sequence: 3,
    },
  ]);

  assert.equal(rows[0].status, AUDIT_STATUS.ERROR);
});

test('deriveBatchRows infers completion from slide events when batch_complete is missing', () => {
  const rows = deriveBatchRows([
    {
      id: 'start-1',
      type: 'batch_start',
      runId: 'run-interrupted',
      timestamp: '2026-06-08T12:00:00.000Z',
      summary: { fileCount: 3 },
      sequence: 1,
    },
    {
      id: 'slide-1',
      type: 'slide_processed',
      runId: 'run-interrupted',
      timestamp: '2026-06-08T12:01:00.000Z',
      sequence: 2,
    },
    {
      id: 'slide-2',
      type: 'slide_processed',
      runId: 'run-interrupted',
      timestamp: '2026-06-08T12:02:00.000Z',
      sequence: 3,
    },
    {
      id: 'slide-3',
      type: 'slide_error',
      runId: 'run-interrupted',
      timestamp: '2026-06-08T12:03:00.000Z',
      sequence: 4,
    },
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].status, AUDIT_STATUS.SUCCESS);
  assert.equal(rows[0].successCount, 2);
  assert.equal(rows[0].errorCount, 1);
  assert.equal(rows[0].totalCount, 3);
  assert.equal(rows[0].completedAt, '2026-06-08T12:03:00.000Z');
  assert.equal(rows[0].inferredComplete, true);
});

test('deriveBatchRows keeps partial slide progress as pending when fileCount exceeds slide events', () => {
  const rows = deriveBatchRows([
    {
      id: 'start-1',
      type: 'batch_start',
      runId: 'run-partial',
      timestamp: '2026-06-08T12:00:00.000Z',
      summary: { fileCount: 5 },
      sequence: 1,
    },
    {
      id: 'slide-1',
      type: 'slide_processed',
      runId: 'run-partial',
      timestamp: '2026-06-08T12:01:00.000Z',
      sequence: 2,
    },
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].status, AUDIT_STATUS.PENDING);
  assert.equal(rows[0].successCount, null);
  assert.equal(rows[0].completedAt, null);
});

test('deriveBatchRows sorts newest completed batches first', () => {
  const rows = deriveBatchRows([
    {
      id: 'start-old',
      type: 'batch_start',
      runId: 'run-old',
      timestamp: '2026-06-08T10:00:00.000Z',
      sequence: 1,
    },
    {
      id: 'complete-old',
      type: 'batch_complete',
      runId: 'run-old',
      timestamp: '2026-06-08T10:05:00.000Z',
      summary: { successCount: 1, errorCount: 0, totalCount: 1 },
      sequence: 2,
    },
    {
      id: 'start-new',
      type: 'batch_start',
      runId: 'run-new',
      timestamp: '2026-06-08T12:00:00.000Z',
      sequence: 3,
    },
    {
      id: 'complete-new',
      type: 'batch_complete',
      runId: 'run-new',
      timestamp: '2026-06-08T12:05:00.000Z',
      summary: { successCount: 2, errorCount: 0, totalCount: 2 },
      sequence: 4,
    },
  ]);

  assert.deepEqual(rows.map((r) => r.runId), ['run-new', 'run-old']);
});

test('resolveAuditEntryIdsToDelete returns empty array for empty selection', () => {
  assert.deepEqual(
    resolveAuditEntryIdsToDelete({ activeTab: 'slides', selectedRows: [], allEntries: [] }),
    [],
  );
});

test('resolveAuditEntryIdsToDelete returns selected slide entry ids', () => {
  const ids = resolveAuditEntryIdsToDelete({
    activeTab: 'slides',
    selectedRows: [
      { id: 'slide-1', type: 'slide_processed' },
      { id: 'slide-2', type: 'slide_error' },
    ],
    allEntries: [],
  });
  assert.deepEqual(ids, ['slide-1', 'slide-2']);
});

test('resolveAuditEntryIdsToDelete expands batch selection to all entries for runIds', () => {
  const allEntries = [
    { id: 'start-1', type: 'batch_start', runId: 'run-a' },
    { id: 'complete-1', type: 'batch_complete', runId: 'run-a' },
    { id: 'slide-1', type: 'slide_processed', runId: 'run-a' },
    { id: 'upload-1', type: 'upload_complete', runId: 'run-a' },
    { id: 'start-2', type: 'batch_start', runId: 'run-b' },
  ];
  const ids = resolveAuditEntryIdsToDelete({
    activeTab: 'batches',
    selectedRows: [{ id: 'run-a', runId: 'run-a' }],
    allEntries,
  });
  assert.deepEqual(ids.sort(), ['complete-1', 'slide-1', 'start-1', 'upload-1']);
});
