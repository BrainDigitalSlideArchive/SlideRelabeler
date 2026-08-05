import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveOutputBasename,
  resolveOutputFilenameStem,
  migrateFilenameConfig,
  normalizeFilenameConfig,
  getFilenameSource,
  buildOutputFilenameColumnOptions,
} from './output_filename.js';

const assembly = {
  fieldsOrder: ['Accession', 'BlockId'],
  separator: '_',
  specimenId: { source: 'from_metadata' },
};

describe('normalizeFilenameConfig', () => {
  it('maps legacy use_uuid false to computed', () => {
    const n = normalizeFilenameConfig({ use_uuid: false });
    assert.equal(n.source, 'computed');
    assert.equal(n.use_uuid, false);
  });

  it('maps legacy use_uuid true to uuid', () => {
    const n = normalizeFilenameConfig({ use_uuid: true });
    assert.equal(n.source, 'uuid');
  });

  it('defaults preserve_source_extension to false', () => {
    const n = normalizeFilenameConfig({});
    assert.equal(n.preserve_source_extension, false);
  });

  it('keeps preserve_source_extension when set', () => {
    const n = normalizeFilenameConfig({ preserve_source_extension: true });
    assert.equal(n.preserve_source_extension, true);
  });
});

describe('migrateFilenameConfig', () => {
  it('uses column mode when csv rename column set and use_uuid false', () => {
    const f = migrateFilenameConfig({
      filename: { use_uuid: false },
      csv: { file_rename_column: 'output_name' },
    });
    assert.equal(f.source, 'column');
    assert.equal(f.column, 'output_name');
  });
});

describe('resolveOutputBasename', () => {
  const row = {
    Accession: 'CASE42',
    BlockId: 'B12',
    output_name: 'MY_CSV_NAME',
    AssembledName: 'CASE42_B12',
    __reserved: {
      uuid: 'uuid-123',
      rename: 'old_rename',
      source: { filename: 'E22-02_ABETA_2.svs' },
    },
  };

  it('original mode uses source basename', () => {
    assert.equal(
      resolveOutputBasename(row, { filename: { source: 'original' } }),
      'E22-02_ABETA_2',
    );
  });

  it('uuid mode uses uuid', () => {
    assert.equal(
      resolveOutputBasename(row, { filename: { source: 'uuid' } }),
      'uuid-123',
    );
  });

  it('column mode reads configured column', () => {
    assert.equal(
      resolveOutputBasename(row, { filename: { source: 'column', column: 'output_name' } }),
      'MY_CSV_NAME',
    );
  });

  it('computed mode builds assembled name', () => {
    assert.equal(
      resolveOutputBasename(row, { filename: { source: 'computed' }, assembly }),
      'CASE42_B12',
    );
  });
  it('pattern mode evaluates placeholders', () => {
    assert.equal(
      resolveOutputBasename(row, { filename: { source: 'pattern', pattern: 'deid_{uuid}' } }),
      'deid_uuid-123',
    );
  });
});

describe('resolveOutputFilenameStem', () => {
  const row = {
    __reserved: {
      uuid: 'uuid-123',
      rename: 'my_custom_name',
      renameSource: 'user',
      source: { filename: 'slide.svs', parsed: { ext: '.svs' } },
    },
  };

  it('uses stored rename verbatim for user-edited rows', () => {
    assert.equal(
      resolveOutputFilenameStem(row, { filename: { source: 'pattern', pattern: 'deid_{uuid}' } }),
      'my_custom_name',
    );
  });

  it('resolves pattern when rename is not stored', () => {
    const noRename = {
      __reserved: {
        uuid: 'uuid-123',
        renameSource: 'default',
        source: { filename: 'slide.svs' },
      },
    };
    assert.equal(
      resolveOutputFilenameStem(noRename, {
        filename: { source: 'pattern', pattern: 'deid_{uuid}' },
      }),
      'deid_uuid-123',
    );
  });
});

describe('getFilenameSource', () => {
  it('returns normalized source', () => {
    assert.equal(getFilenameSource({ filename: { source: 'original' } }), 'original');
  });
});

describe('buildOutputFilenameColumnOptions', () => {
  const reservedCols = [
    { field: '__reserved.source.directory', headerName: 'Directory' },
    { field: '__reserved.bytes', headerName: 'Size' },
  ];

  it('never includes reserved grid columns from fileCols', () => {
    const options = buildOutputFilenameColumnOptions({
      fileCols: reservedCols,
      fileRows: [],
    });
    const values = options.map((o) => o.value);
    assert.equal(values.includes('__reserved.source.directory'), false);
    assert.equal(values.includes('__reserved.bytes'), false);
  });

  it('includes metadata keys from loaded rows', () => {
    const options = buildOutputFilenameColumnOptions({
      fileRows: [{ Accession: 'A1', output_name: 'OUT', CompressedFileLocation: '/path/x.svs' }],
      fileCols: [],
    });
    const values = options.map((o) => o.value);
    assert.equal(values.includes('Accession'), true);
    assert.equal(values.includes('output_name'), true);
    assert.equal(values.includes('CompressedFileLocation'), false);
    assert.equal(values.includes('AssembledName'), false);
  });

  it('returns empty when no files loaded and no saved column', () => {
    const options = buildOutputFilenameColumnOptions({ fileRows: [], fileCols: [] });
    assert.equal(options.length, 0);
  });

  it('includes savedColumn even when not otherwise present', () => {
    const options = buildOutputFilenameColumnOptions({
      fileRows: [],
      fileCols: [],
      savedColumn: 'custom_header',
    });
    const values = options.map((o) => o.value);
    assert.equal(values.includes('custom_header'), true);
  });

  it('excludes csv path and destination columns from options', () => {
    const options = buildOutputFilenameColumnOptions({
      fileRows: [{ path: '/a.svs', output_name: 'OUT', dest: 'D:/out' }],
      fileCols: [{ field: 'path' }, { field: 'output_name' }, { field: 'dest' }],
      csvConfig: {
        file_path_column: 'path',
        file_destination_directory_column: 'dest',
      },
    });
    const values = options.map((o) => o.value);
    assert.equal(values.includes('path'), false);
    assert.equal(values.includes('dest'), false);
    assert.equal(values.includes('output_name'), true);
  });
});
