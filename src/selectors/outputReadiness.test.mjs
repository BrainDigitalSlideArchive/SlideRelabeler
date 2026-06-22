import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  allRowsHaveDestinationDirectory,
  getOutputDirectoryPanelCopy,
  normalizeSetOutputDirPayload,
  resolveRowsAfterSetOutputDir,
  rowHasDestinationDirectory,
  selectOutputReadiness,
  summarizeDestinationDirectories,
} from './outputReadiness.js';

const rowWithDest = (dest) => ({
  __reserved: { destinationDirectory: dest },
});

const baseState = {
  files: {
    output_dir: null,
    file_rows: [],
    csv: {
      needs_output_dir: true,
      needs_csv_output_dir: false,
      output_dir: null,
      headers: null,
    },
  },
};

describe('rowHasDestinationDirectory', () => {
  it('returns true for non-empty trimmed path', () => {
    assert.equal(rowHasDestinationDirectory(rowWithDest('/out/a')), true);
  });

  it('returns false for missing or blank path', () => {
    assert.equal(rowHasDestinationDirectory({ __reserved: {} }), false);
    assert.equal(rowHasDestinationDirectory(rowWithDest('   ')), false);
  });
});

describe('summarizeDestinationDirectories', () => {
  it('returns zero counts for empty input', () => {
    assert.deepEqual(summarizeDestinationDirectories([]), {
      total: 0,
      filled: 0,
      empty: 0,
      perRowComplete: false,
    });
  });

  it('reports partial fill state', () => {
    assert.deepEqual(
      summarizeDestinationDirectories([rowWithDest('/out/a'), { __reserved: {} }]),
      { total: 2, filled: 1, empty: 1, perRowComplete: false },
    );
  });

  it('reports complete fill state', () => {
    assert.deepEqual(
      summarizeDestinationDirectories([rowWithDest('/out/a'), rowWithDest('/out/b')]),
      { total: 2, filled: 2, empty: 0, perRowComplete: true },
    );
  });
});

describe('allRowsHaveDestinationDirectory', () => {
  it('returns false for empty rows', () => {
    assert.equal(allRowsHaveDestinationDirectory([]), false);
    assert.equal(allRowsHaveDestinationDirectory(null), false);
  });

  it('returns false when any row lacks destination', () => {
    assert.equal(
      allRowsHaveDestinationDirectory([
        rowWithDest('/out/a'),
        rowWithDest(''),
      ]),
      false,
    );
    assert.equal(
      allRowsHaveDestinationDirectory([
        rowWithDest('/out/a'),
        { __reserved: {} },
      ]),
      false,
    );
  });

  it('returns true when every row has a non-empty destination', () => {
    assert.equal(
      allRowsHaveDestinationDirectory([
        rowWithDest('/out/a'),
        rowWithDest('/out/b'),
      ]),
      true,
    );
  });

  it('ignores whitespace-only destinations', () => {
    assert.equal(allRowsHaveDestinationDirectory([rowWithDest('   ')]), false);
  });
});

describe('normalizeSetOutputDirPayload', () => {
  it('coerces legacy string payload', () => {
    assert.deepEqual(normalizeSetOutputDirPayload('/global/out'), {
      folder: '/global/out',
      mode: 'all',
    });
  });

  it('preserves explicit mode', () => {
    assert.deepEqual(normalizeSetOutputDirPayload({
      folder: '/global/out',
      mode: 'empty_only',
    }), {
      folder: '/global/out',
      mode: 'empty_only',
    });
  });
});

describe('resolveRowsAfterSetOutputDir', () => {
  it('updates all rows in all mode', () => {
    const rows = [rowWithDest('/old/a'), { __reserved: {} }];
    const result = resolveRowsAfterSetOutputDir(rows, '/new', 'all');
    assert.equal(result[0].__reserved.destinationDirectory, '/new');
    assert.equal(result[1].__reserved.destinationDirectory, '/new');
  });

  it('updates only empty rows in empty_only mode', () => {
    const rows = [rowWithDest('/old/a'), { __reserved: {} }];
    const result = resolveRowsAfterSetOutputDir(rows, '/new', 'empty_only');
    assert.equal(result[0].__reserved.destinationDirectory, '/old/a');
    assert.equal(result[1].__reserved.destinationDirectory, '/new');
  });
});

describe('getOutputDirectoryPanelCopy', () => {
  it('partial slide state uses ready badge and short body', () => {
    const copy = getOutputDirectoryPanelCopy(
      'slide',
      { total: 2, filled: 1, empty: 1, perRowComplete: false },
      null,
      true,
    );
    assert.equal(copy.badge, '1 of 2 ready');
    assert.equal(copy.body, 'Set the rest individually in the Copy To column in the table below, or choose a destination folder for the remaining files.');
    assert.equal(copy.showProgress, true);
    assert.equal(copy.body.includes('asked'), false);
  });

  it('none set required slide state', () => {
    const copy = getOutputDirectoryPanelCopy(
      'slide',
      { total: 3, filled: 0, empty: 3, perRowComplete: false },
      null,
      true,
    );
    assert.equal(copy.badge, 'Required');
    assert.equal(copy.body, 'Set Copy To per file in the table below, or choose one folder for all.');
    assert.equal(copy.buttonLabel, 'Choose folder…');
  });

  it('all ready slide state', () => {
    const copy = getOutputDirectoryPanelCopy(
      'slide',
      { total: 2, filled: 2, empty: 0, perRowComplete: true },
      null,
      false,
    );
    assert.equal(copy.badge, 'All ready');
    assert.equal(copy.optionalAction, true);
  });

  it('global path set shows path row', () => {
    const copy = getOutputDirectoryPanelCopy(
      'slide',
      { total: 2, filled: 2, empty: 0, perRowComplete: true },
      '/Users/out/deid',
      false,
    );
    assert.equal(copy.badge, 'Folder set');
    assert.equal(copy.path, '/Users/out/deid');
    assert.equal(copy.body, null);
    assert.equal(copy.buttonLabel, 'Change folder…');
  });

  it('csv required state', () => {
    const copy = getOutputDirectoryPanelCopy('csv', null, null, true);
    assert.equal(copy.title, 'Output CSV location');
    assert.equal(copy.badge, 'Required');
    assert.equal(copy.body, 'Select where to write the output CSV.');
  });
});

describe('selectOutputReadiness', () => {
  it('slideOutputReady via global output_dir', () => {
    const result = selectOutputReadiness({
      files: {
        ...baseState.files,
        output_dir: '/global/out',
        file_rows: [{ __reserved: {} }],
      },
    });
    assert.equal(result.slideOutputReady, true);
    assert.equal(result.processReady, true);
    assert.equal(result.outputDirRequired, false);
  });

  it('slideOutputReady via per-row destinations when needs_output_dir', () => {
    const result = selectOutputReadiness({
      files: {
        ...baseState.files,
        file_rows: [rowWithDest('/out/a'), rowWithDest('/out/b')],
      },
    });
    assert.equal(result.perRowComplete, true);
    assert.equal(result.slideOutputReady, true);
    assert.equal(result.processReady, true);
    assert.equal(result.outputDirRequired, false);
  });

  it('processReady blocked when needs_csv_output_dir and no csv.output_dir', () => {
    const result = selectOutputReadiness({
      files: {
        ...baseState.files,
        file_rows: [rowWithDest('/out/a')],
        csv: {
          needs_output_dir: false,
          needs_csv_output_dir: true,
          output_dir: null,
          headers: ['path'],
        },
      },
    });
    assert.equal(result.slideOutputReady, true);
    assert.equal(result.csvOutputReady, false);
    assert.equal(result.processReady, false);
    assert.equal(result.csvOutputDirRequired, true);
  });

  it('outputDirRequired true when needs_output_dir and no global or per-row dest', () => {
    const result = selectOutputReadiness({
      files: {
        ...baseState.files,
        file_rows: [rowWithDest('/out/a'), { __reserved: {} }],
      },
    });
    assert.equal(result.perRowComplete, false);
    assert.equal(result.outputDirRequired, true);
    assert.equal(result.slideOutputReady, false);
    assert.equal(result.processReady, false);
  });

  it('slideOutputReady via per-row when no csv headers (dialog-only workflow)', () => {
    const result = selectOutputReadiness({
      files: {
        ...baseState.files,
        csv: {
          needs_output_dir: false,
          needs_csv_output_dir: false,
          output_dir: null,
          headers: null,
        },
        file_rows: [rowWithDest('/out/a')],
      },
      config: { filename: { source: 'uuid' }, label: {}, csv: {}, dsa_upload: {} },
    });
    assert.equal(result.slideOutputReady, true);
    assert.equal(result.processReady, true);
  });

  it('processReady blocked when pattern rows missing columns', () => {
    const result = selectOutputReadiness({
      files: {
        ...baseState.files,
        file_rows: [
          { __reserved: { renameSource: 'default', uuid: 'u1' } },
        ],
        file_cols: [],
        csv: { ...baseState.files.csv, needs_output_dir: false },
      },
      config: {
        filename: { source: 'pattern', pattern: '{blockId}' },
        label: { labelText: { mode: 'output_name' }, qrContent: { mode: 'output_name' } },
        csv: {},
        dsa_upload: {},
      },
    });
    assert.equal(result.patternValidation.blocking, true);
    assert.equal(result.processReady, false);
  });
});
