import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_AUDIT_FILTER,
  filterAuditEntries,
  sortAuditEntriesNewestFirst,
} from './audit_log_filter.js';

const sampleEntries = [
  {
    id: '1',
    timestamp: '2026-06-01T10:00:00.000Z',
    type: 'slide_processed',
    status: 'success',
    sourcePath: '/a.svs',
    outputPath: '/out/a.svs',
    outputName: 'A1',
    errorMessage: '',
    uuid: 'u1',
  },
  {
    id: '2',
    timestamp: '2026-06-02T12:00:00.000Z',
    type: 'slide_error',
    status: 'error',
    sourcePath: '/b.svs',
    outputPath: '',
    outputName: 'B1',
    errorMessage: 'decode failed',
    uuid: 'u2',
  },
  {
    id: '3',
    timestamp: '2026-06-03T08:00:00.000Z',
    type: 'upload_complete',
    status: 'success',
    sourcePath: '/c.svs',
    outputPath: '/out/c.svs',
    outputName: 'C1',
    errorMessage: '',
    uuid: 'u3',
  },
];

test('filterAuditEntries matches type and status', () => {
  const filtered = filterAuditEntries(sampleEntries, {
    ...DEFAULT_AUDIT_FILTER,
    type: 'slide_error',
    status: 'error',
  });
  assert.deepEqual(filtered.map((e) => e.id), ['2']);
});

test('filterAuditEntries matches search text across fields', () => {
  const filtered = filterAuditEntries(sampleEntries, {
    ...DEFAULT_AUDIT_FILTER,
    search: 'decode',
  });
  assert.deepEqual(filtered.map((e) => e.id), ['2']);
});

test('filterAuditEntries respects date range', () => {
  const filtered = filterAuditEntries(sampleEntries, {
    ...DEFAULT_AUDIT_FILTER,
    dateFrom: '2026-06-02',
    dateTo: '2026-06-02',
  });
  assert.deepEqual(filtered.map((e) => e.id), ['2']);
});

test('sortAuditEntriesNewestFirst orders by sequence descending', () => {
  const collidingTimestamp = '2026-06-21T17:00:14.000Z';
  const entries = [
    { id: 'start', timestamp: '2026-06-21T17:00:12.000Z', sequence: 0, type: 'batch_start' },
    { id: 'slide-a', timestamp: '2026-06-21T17:00:13.000Z', sequence: 1, type: 'slide_processed' },
    { id: 'slide-b', timestamp: collidingTimestamp, sequence: 2, type: 'slide_processed' },
    { id: 'complete', timestamp: collidingTimestamp, sequence: 3, type: 'batch_complete' },
  ];
  const sorted = sortAuditEntriesNewestFirst(entries);
  assert.deepEqual(sorted.map((e) => e.id), ['complete', 'slide-b', 'slide-a', 'start']);
});
