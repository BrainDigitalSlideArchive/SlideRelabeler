import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildExamplePreviewRow,
  clonePreviewRowFromFileRow,
  clearManualRenameOverride,
  isManualRenameOverride,
  resolveLabelPreviewFilePath,
  updatePreviewRowCell,
} from './config_preview_row.js';
import { NAMING_SOURCE } from './row_naming_defaults.js';

const baseConfig = {
  filename: { source: 'uuid' },
  label: {
    add_text: true,
    add_qr: true,
    textDefault: 'output_name',
    qrDefault: 'uuid',
  },
};

test('buildExamplePreviewRow initializes default sources, naming defaults, and demo grid fields', () => {
  const row = buildExamplePreviewRow({
    uuid: 'uuid-123',
    filename: '1234.tiff',
    fileCols: [{ field: 'BlockId' }],
    config: baseConfig,
  });
  assert.equal(row.__reserved.uuid, 'uuid-123');
  assert.equal(row.__reserved.processed, 0);
  assert.equal(row.__reserved.progress, 0);
  assert.equal(row.__reserved.bytes, 372_000_000);
  assert.deepEqual(row.__reserved.associatedImages, ['thumbnail', 'label', 'macro']);
  assert.equal(row.__reserved.destinationDirectory, null);
  assert.equal(row.__reserved.source.directory, '/example/path');
  assert.equal(row.__reserved.source.path, null);
  assert.equal(row.__reserved.source.parsed.ext, '.tiff');
  assert.equal(row.__reserved.labelTextSource, NAMING_SOURCE.DEFAULT);
  assert.equal(row.__reserved.renameSource, NAMING_SOURCE.DEFAULT);
  assert.equal(row.BlockId, 'B1');
  assert.equal(row.__reserved.rename, 'uuid-123');
});

test('updatePreviewRowCell clearing Label reverts to default source behavior', () => {
  const row = buildExamplePreviewRow({
    uuid: 'uuid-123',
    filename: '1234.tiff',
    config: baseConfig,
  });
  const edited = updatePreviewRowCell(row, '__reserved.labelText', 'custom', baseConfig);
  assert.equal(edited.__reserved.labelText, 'custom');
  assert.equal(edited.__reserved.labelTextSource, NAMING_SOURCE.USER);

  const cleared = updatePreviewRowCell(edited, '__reserved.labelText', '', baseConfig);
  assert.equal(cleared.__reserved.labelTextSource, NAMING_SOURCE.USER);
  assert.equal(cleared.__reserved.labelText, undefined);
});

test('clonePreviewRowFromFileRow preserves path and metadata', () => {
  const source = {
    BlockId: 'B2',
    __reserved: {
      uuid: 'u1',
      source: { path: '/tmp/a.tiff', filename: 'a.tiff' },
      labelText: 'hello',
      labelTextSource: NAMING_SOURCE.USER,
    },
  };
  const clone = clonePreviewRowFromFileRow(source);
  assert.notEqual(clone, source);
  assert.equal(clone.BlockId, 'B2');
  assert.equal(clone.__reserved.source.path, '/tmp/a.tiff');
  assert.equal(clone.__reserved.labelText, 'hello');
});

test('isManualRenameOverride detects non-empty user rename', () => {
  const row = buildExamplePreviewRow({
    uuid: 'uuid-123',
    filename: '1234.tiff',
    config: baseConfig,
  });
  assert.equal(isManualRenameOverride(row), false);

  const edited = updatePreviewRowCell(row, '__reserved.rename', 'custom-name', baseConfig);
  assert.equal(isManualRenameOverride(edited), true);
});

test('isManualRenameOverride is false when rename is blank despite user source', () => {
  const row = buildExamplePreviewRow({
    uuid: 'uuid-123',
    filename: '1234.tiff',
    config: baseConfig,
  });
  const edited = updatePreviewRowCell(row, '__reserved.rename', '   ', baseConfig);
  assert.equal(isManualRenameOverride(edited), false);
});

test('clearManualRenameOverride restores config-driven rename', () => {
  const row = buildExamplePreviewRow({
    uuid: 'uuid-123',
    filename: '1234.tiff',
    config: baseConfig,
  });
  const edited = updatePreviewRowCell(row, '__reserved.rename', 'custom-name', baseConfig);
  const cleared = clearManualRenameOverride(edited, baseConfig);
  assert.equal(cleared.__reserved.renameSource, NAMING_SOURCE.DEFAULT);
  assert.equal(cleared.__reserved.rename, 'uuid-123');
  assert.equal(isManualRenameOverride(cleared), false);
});

test('resolveLabelPreviewFilePath returns null for example rows and path for loaded rows', () => {
  const example = buildExamplePreviewRow({
    uuid: 'uuid-123',
    filename: '1234.tiff',
    config: baseConfig,
  });
  assert.equal(resolveLabelPreviewFilePath(example), null);

  const loaded = clonePreviewRowFromFileRow({
    __reserved: { source: { path: '/tmp/slide.tiff' } },
  });
  assert.equal(resolveLabelPreviewFilePath(loaded), '/tmp/slide.tiff');
  assert.equal(resolveLabelPreviewFilePath({ __reserved: { source: { path: '  ' } } }), null);
});
