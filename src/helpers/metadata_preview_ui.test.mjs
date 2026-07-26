import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveMetadataTable,
  getMetadataModalBranch,
  makePreviewErrorTable,
  PREVIEW_ERROR_KEY,
  METADATA_UNAVAILABLE_MESSAGE,
} from './metadata_preview_ui.js';

const fileRow = {
  __reserved: {
    source: { path: '/tmp/slide.tif' },
    processed: 0,
  },
};

test('resolveMetadataTable uses path-in-ifds even for empty entries', () => {
  const ifds = { '/tmp/slide.tif': {} };
  const resolved = resolveMetadataTable(ifds, '/tmp/slide.tif', fileRow);
  assert.equal(resolved.pathInIfds, true);
  assert.equal(resolved.matchedBy, 'source.path');
  assert.deepEqual(resolved.table, {});
});

test('resolveMetadataTable returns pathInIfds false when missing', () => {
  const resolved = resolveMetadataTable({}, '/tmp/slide.tif', fileRow);
  assert.equal(resolved.pathInIfds, false);
  assert.equal(resolved.table, null);
});

test('getMetadataModalBranch: missing ifds → loading', () => {
  const result = getMetadataModalBranch(null, fileRow, false);
  assert.equal(result.branch, 'loading');
});

test('getMetadataModalBranch: __previewError → error', () => {
  const table = makePreviewErrorTable('This file format is not supported for de-identification / metadata preview.');
  const result = getMetadataModalBranch(table, fileRow, true);
  assert.equal(result.branch, 'error');
  assert.match(result.message, /not supported for de-identification/i);
  assert.equal(table[PREVIEW_ERROR_KEY], result.message);
});

test('getMetadataModalBranch: non-empty IFD array → grid', () => {
  const table = [{ ifd: 0, tag: '256', name: 'ImageWidth', prior: [1], after: [1], diff: false }];
  const result = getMetadataModalBranch(table, fileRow, true);
  assert.equal(result.branch, 'grid');
});

test('getMetadataModalBranch: empty object with path present → unavailable', () => {
  const result = getMetadataModalBranch({}, fileRow, true);
  assert.equal(result.branch, 'unavailable');
  assert.equal(result.message, METADATA_UNAVAILABLE_MESSAGE);
});

test('getMetadataModalBranch: processed file', () => {
  const processed = { __reserved: { source: { path: '/tmp/a.tif' }, processed: 1 } };
  const result = getMetadataModalBranch(null, processed, false);
  assert.equal(result.branch, 'processed');
});
