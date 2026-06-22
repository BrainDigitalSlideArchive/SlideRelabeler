import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AUDIT_STATUS,
  buildBatchCompleteEntry,
  buildSlideAuditEntry,
  buildSlideErrorAuditEntry,
  clampAuditMaxEntries,
  countEntriesToTrim,
  hasSlideAuditForSource,
  hasSlideErrorAuditForSource,
  resolveAuditMaxEntries,
  trimAuditEntries,
} from './audit_log.js';

test('trimAuditEntries keeps newest entries when over limit', () => {
  const entries = Array.from({ length: 5 }, (_, i) => ({ id: String(i) }));
  const trimmed = trimAuditEntries(entries, 3);
  assert.deepEqual(trimmed.map((e) => e.id), ['2', '3', '4']);
});

test('trimAuditEntries returns all entries when maxEntries is null', () => {
  const entries = Array.from({ length: 10 }, (_, i) => ({ id: String(i) }));
  assert.equal(trimAuditEntries(entries, null), entries);
});

test('resolveAuditMaxEntries treats null as unlimited and undefined as default', () => {
  assert.equal(resolveAuditMaxEntries({ maxEntries: null }), null);
  assert.equal(resolveAuditMaxEntries({ maxEntries: 1000 }), 1000);
  assert.equal(resolveAuditMaxEntries({}, null), null);
  assert.equal(resolveAuditMaxEntries({}, 5000), 5000);
});

test('countEntriesToTrim returns zero for unlimited or sufficient limit', () => {
  assert.equal(countEntriesToTrim(11, null), 0);
  assert.equal(countEntriesToTrim(11, 20), 0);
  assert.equal(countEntriesToTrim(11, 11), 0);
  assert.equal(countEntriesToTrim(11, 5), 6);
});

test('clampAuditMaxEntries enforces min and max bounds', () => {
  assert.equal(clampAuditMaxEntries(50), 100);
  assert.equal(clampAuditMaxEntries(5000), 5000);
  assert.equal(clampAuditMaxEntries(999999), 100000);
});

test('buildSlideAuditEntry captures paths and output name from row metadata', () => {
  const entry = buildSlideAuditEntry({
    type: 'slide_processed',
    runId: 'run-1',
    fileRow: {
      Accession: 'CASE1',
      __reserved: {
        source: { path: '/in/slide.svs' },
        output_path: '/out/slide.svs',
        rename: 'CASE1_deid',
        uuid: 'uuid-1',
      },
    },
    config: { filename: { source: 'rename' } },
    status: AUDIT_STATUS.SUCCESS,
  });

  assert.equal(entry.type, 'slide_processed');
  assert.equal(entry.runId, 'run-1');
  assert.equal(entry.sourcePath, '/in/slide.svs');
  assert.equal(entry.outputPath, '/out/slide.svs');
  assert.equal(entry.outputName, 'CASE1_deid');
  assert.equal(entry.status, AUDIT_STATUS.SUCCESS);
  assert.equal(entry.metadata.Accession, 'CASE1');
  assert.equal(entry.metadata.__reserved, undefined);
});

test('buildBatchCompleteEntry stores summary counts and success status when no errors', () => {
  const entry = buildBatchCompleteEntry('run-2', {
    successCount: 3,
    errorCount: 0,
    totalCount: 3,
  });
  assert.equal(entry.type, 'batch_complete');
  assert.equal(entry.runId, 'run-2');
  assert.equal(entry.status, AUDIT_STATUS.SUCCESS);
  assert.deepEqual(entry.summary, { successCount: 3, errorCount: 0, totalCount: 3 });
});

test('buildBatchCompleteEntry uses error status when all slides failed', () => {
  const entry = buildBatchCompleteEntry('run-3', {
    successCount: 0,
    errorCount: 2,
    totalCount: 2,
  });
  assert.equal(entry.status, AUDIT_STATUS.ERROR);
});

test('buildBatchCompleteEntry uses success status for mixed results', () => {
  const entry = buildBatchCompleteEntry('run-4', {
    successCount: 1,
    errorCount: 1,
    totalCount: 2,
  });
  assert.equal(entry.status, AUDIT_STATUS.SUCCESS);
});

test('buildSlideAuditEntry stores errorMessage and errorDetails', () => {
  const entry = buildSlideAuditEntry({
    type: 'slide_error',
    runId: 'run-5',
    fileRow: {
      __reserved: {
        source: { path: '/in/bad.svs' },
        error: 'This slide file appears damaged or unreadable.',
        errorDetails: 'TileSourceError: No available tilesource',
      },
    },
    status: AUDIT_STATUS.ERROR,
  });

  assert.equal(entry.type, 'slide_error');
  assert.equal(entry.errorMessage, 'This slide file appears damaged or unreadable.');
  assert.equal(entry.errorDetails, 'TileSourceError: No available tilesource');
});

test('buildSlideErrorAuditEntry reads error fields from row reserved', () => {
  const entry = buildSlideErrorAuditEntry({
    runId: 'run-6',
    fileRow: {
      __reserved: {
        source: { path: '/in/bad.svs' },
        error: 'Summary text',
        errorDetails: 'Technical details',
      },
    },
    config: {},
    fileCols: [],
  });

  assert.equal(entry.type, 'slide_error');
  assert.equal(entry.status, AUDIT_STATUS.ERROR);
  assert.equal(entry.sourcePath, '/in/bad.svs');
  assert.equal(entry.errorMessage, 'Summary text');
  assert.equal(entry.errorDetails, 'Technical details');
});

test('hasSlideAuditForSource detects existing slide audit for run and path', () => {
  const entries = [
    { runId: 'run-1', type: 'slide_processed', sourcePath: '/in/a.svs' },
    { runId: 'run-1', type: 'slide_error', sourcePath: '/in/b.svs' },
    { runId: 'run-2', type: 'slide_error', sourcePath: '/in/b.svs' },
  ];

  assert.equal(hasSlideAuditForSource(entries, 'run-1', '/in/a.svs'), true);
  assert.equal(hasSlideAuditForSource(entries, 'run-1', '/in/b.svs'), true);
  assert.equal(hasSlideAuditForSource(entries, 'run-1', '/in/c.svs'), false);
  assert.equal(hasSlideAuditForSource(entries, 'run-2', '/in/b.svs'), true);
  assert.equal(hasSlideAuditForSource(entries, 'run-1', ''), false);
});

test('hasSlideErrorAuditForSource ignores slide_processed entries', () => {
  const entries = [
    { runId: 'run-1', type: 'slide_processed', sourcePath: '/in/a.svs' },
    { runId: 'run-1', type: 'slide_error', sourcePath: '/in/b.svs' },
  ];

  assert.equal(hasSlideErrorAuditForSource(entries, 'run-1', '/in/a.svs'), false);
  assert.equal(hasSlideErrorAuditForSource(entries, 'run-1', '/in/b.svs'), true);
});
