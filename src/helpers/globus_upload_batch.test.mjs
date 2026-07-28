import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildGlobusBatchStdin,
  clearDeferredGlobusUploads,
  getDeferredGlobusUploadCount,
  parseMaxUploadBatchSizeInput,
  pushDeferredGlobusUpload,
  quoteGlobusBatchPath,
  resolveMaxUploadBatchSize,
  takeDeferredGlobusUploads,
} from './globus_upload_batch.js';

test('resolveMaxUploadBatchSize: null/empty = unlimited; undefined = 1', () => {
  assert.equal(resolveMaxUploadBatchSize(null), null);
  assert.equal(resolveMaxUploadBatchSize(''), null);
  assert.equal(resolveMaxUploadBatchSize(undefined), 1);
  assert.equal(resolveMaxUploadBatchSize(1), 1);
  assert.equal(resolveMaxUploadBatchSize(5), 5);
  assert.equal(resolveMaxUploadBatchSize('3'), 3);
  assert.equal(resolveMaxUploadBatchSize(0), 1);
});

test('parseMaxUploadBatchSizeInput maps empty to null', () => {
  assert.equal(parseMaxUploadBatchSizeInput(''), null);
  assert.equal(parseMaxUploadBatchSizeInput('  '), null);
  assert.equal(parseMaxUploadBatchSizeInput('4'), 4);
});

test('quoteGlobusBatchPath quotes whitespace', () => {
  assert.equal(quoteGlobusBatchPath('/a/b'), '/a/b');
  assert.equal(quoteGlobusBatchPath('/a b/c'), '"/a b/c"');
});

test('buildGlobusBatchStdin formats path pairs', () => {
  const body = buildGlobusBatchStdin([
    { sourcePath: '/C/out/a.svs', destPath: '/dest/a.svs' },
    { sourcePath: '/C/out/b file.svs', destPath: '/dest/b file.svs' },
  ]);
  assert.equal(
    body,
    '/C/out/a.svs /dest/a.svs\n"/C/out/b file.svs" "/dest/b file.svs"\n',
  );
});

test('deferred buffer take/flush', () => {
  clearDeferredGlobusUploads();
  pushDeferredGlobusUpload({ row_idx: 0 });
  pushDeferredGlobusUpload({ row_idx: 1 });
  pushDeferredGlobusUpload({ row_idx: 2 });
  assert.equal(getDeferredGlobusUploadCount(), 3);
  const first = takeDeferredGlobusUploads(2);
  assert.deepEqual(first.map((x) => x.row_idx), [0, 1]);
  assert.equal(getDeferredGlobusUploadCount(), 1);
  const rest = takeDeferredGlobusUploads(null);
  assert.deepEqual(rest.map((x) => x.row_idx), [2]);
  assert.equal(getDeferredGlobusUploadCount(), 0);
});
