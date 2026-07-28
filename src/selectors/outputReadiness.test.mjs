import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  allRowsHaveDestinationDirectory,
  getDeliveryLocalColumnCopy,
  getDeliveryPanelCopy,
  getDeliverySetupButtonLabel,
  getDeliverySetupModalType,
  getDeliveryUploadStatusCopy,
  SAVE_LOCALLY_NEW_FILES_COMPLETE_HINT,
  normalizeSetOutputDirPayload,
  resolveRowsAfterSetOutputDir,
  rowHasDestinationDirectory,
  selectOutputReadiness,
  summarizeDestinationDirectories,
} from './outputReadiness.js';
import { DESTINATION_SOURCE } from '../helpers/destination_directory.js';

const rowWithDest = (dest, source) => ({
  __reserved: {
    destinationDirectory: dest,
    ...(source != null ? { destinationDirectorySource: source } : {}),
  },
});

const baseConfig = { filename: { source: 'uuid' }, label: {}, csv: {}, dsa_upload: {} };

const dsaReadyState = {
  dsa: {
    api_auth: { authToken: 'token' },
    folder_id: 'folder-1',
  },
};

const baseState = {
  files: {
    output_dir: null,
    file_rows: [],
    csv: {},
  },
  uploadRouting: {
    local_output_enabled: false,
    auto_upload: false,
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
      mode: 'fill_empty',
    });
  });

  it('preserves explicit mode', () => {
    assert.deepEqual(normalizeSetOutputDirPayload({
      folder: '/global/out',
      mode: 'update_default_sourced',
    }), {
      folder: '/global/out',
      mode: 'update_default_sourced',
    });
  });
});

describe('resolveRowsAfterSetOutputDir', () => {
  it('updates default-sourced rows in update_default_sourced mode', () => {
    const rows = [
      rowWithDest('/old/a', DESTINATION_SOURCE.DEFAULT),
      rowWithDest('/csv/a', DESTINATION_SOURCE.CSV),
      { __reserved: {} },
    ];
    const result = resolveRowsAfterSetOutputDir(rows, '/new', 'update_default_sourced');
    assert.equal(result[0].__reserved.destinationDirectory, '/new');
    assert.equal(result[1].__reserved.destinationDirectory, '/csv/a');
    assert.equal(result[2].__reserved.destinationDirectory, '/new');
  });

  it('updates only empty rows in fill_empty mode', () => {
    const rows = [rowWithDest('/old/a', DESTINATION_SOURCE.USER), { __reserved: {} }];
    const result = resolveRowsAfterSetOutputDir(rows, '/new', 'fill_empty');
    assert.equal(result[0].__reserved.destinationDirectory, '/old/a');
    assert.equal(result[1].__reserved.destinationDirectory, '/new');
  });

  it('leaves rows unchanged in default_only mode', () => {
    const rows = [rowWithDest('/old/a'), { __reserved: {} }];
    const result = resolveRowsAfterSetOutputDir(rows, '/new', 'default_only');
    assert.equal(result[0].__reserved.destinationDirectory, '/old/a');
    assert.equal(result[1].__reserved.destinationDirectory, undefined);
  });
});

describe('selectOutputReadiness', () => {
  it('processReady false when both delivery toggles are off', () => {
    const result = selectOutputReadiness({
      ...baseState,
      config: baseConfig,
    });
    assert.equal(result.anyDeliveryEnabled, false);
    assert.equal(result.localEnabled, false);
    assert.equal(result.uploadEnabled, false);
    assert.equal(result.processReady, false);
  });

  it('local on with all rows having Copy To is configured and processReady', () => {
    const result = selectOutputReadiness({
      ...baseState,
      uploadRouting: { local_output_enabled: true, auto_upload: false },
      files: {
        ...baseState.files,
        file_rows: [rowWithDest('/out/a'), rowWithDest('/out/b')],
      },
      config: baseConfig,
    });
    assert.equal(result.localEnabled, true);
    assert.equal(result.localConfigured, true);
    assert.equal(result.uploadEnabled, false);
    assert.equal(result.processReady, true);
  });

  it('local on with global folder set but rows incomplete is not configured', () => {
    const result = selectOutputReadiness({
      ...baseState,
      uploadRouting: { local_output_enabled: true, auto_upload: false },
      files: {
        ...baseState.files,
        output_dir: '/global/out',
        file_rows: [{ __reserved: {} }],
      },
      config: baseConfig,
    });
    assert.equal(result.localConfigured, false);
    assert.equal(result.processReady, false);
    assert.equal(result.outputDirRequired, true);
  });

  it('upload on with local off and DSA ready is configured', () => {
    const result = selectOutputReadiness({
      ...baseState,
      uploadRouting: { local_output_enabled: false, auto_upload: true },
      files: {
        ...baseState.files,
        file_rows: [{ __reserved: {} }],
      },
      config: baseConfig,
      ...dsaReadyState,
    });
    assert.equal(result.uploadOnly, true);
    assert.equal(result.uploadConfigured, true);
    assert.equal(result.localConfigured, true);
    assert.equal(result.processReady, true);
  });

  it('upload on without credentials is not configured', () => {
    const result = selectOutputReadiness({
      ...baseState,
      uploadRouting: { local_output_enabled: false, auto_upload: true },
      files: {
        ...baseState.files,
        file_rows: [{ __reserved: {} }],
      },
      config: baseConfig,
      dsa: {},
    });
    assert.equal(result.uploadConfigured, false);
    assert.equal(result.processReady, false);
  });

  it('both on requires local and upload configuration', () => {
    const incomplete = selectOutputReadiness({
      ...baseState,
      uploadRouting: { local_output_enabled: true, auto_upload: true },
      files: {
        ...baseState.files,
        file_rows: [{ __reserved: {} }],
      },
      config: baseConfig,
      ...dsaReadyState,
    });
    assert.equal(incomplete.localConfigured, false);
    assert.equal(incomplete.uploadConfigured, true);
    assert.equal(incomplete.processReady, false);

    const ready = selectOutputReadiness({
      ...baseState,
      uploadRouting: { local_output_enabled: true, auto_upload: true, keep_local_copy: true },
      files: {
        ...baseState.files,
        file_rows: [rowWithDest('/out/a')],
      },
      config: baseConfig,
      ...dsaReadyState,
    });
    assert.equal(ready.localConfigured, true);
    assert.equal(ready.uploadConfigured, true);
    assert.equal(ready.processReady, true);
  });

  it('processReady when CSV import has per-row destinations and local enabled', () => {
    const result = selectOutputReadiness({
      ...baseState,
      uploadRouting: { local_output_enabled: true, auto_upload: false },
      files: {
        ...baseState.files,
        file_rows: [rowWithDest('/out/a'), rowWithDest('/out/b')],
      },
      config: baseConfig,
    });
    assert.equal(result.localConfigured, true);
    assert.equal(result.processReady, true);
    assert.equal(result.outputDirRequired, false);
  });

  it('processReady blocked when pattern rows missing columns', () => {
    const result = selectOutputReadiness({
      ...baseState,
      uploadRouting: { local_output_enabled: true, auto_upload: false },
      files: {
        ...baseState.files,
        file_rows: [
          { __reserved: { renameSource: 'default', uuid: 'u1', destinationDirectory: '/out' } },
        ],
        file_cols: [],
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

describe('getDeliveryLocalColumnCopy', () => {
  it('returns off text when local is disabled', () => {
    const copy = getDeliveryLocalColumnCopy(null, null, { localEnabled: false });
    assert.equal(copy.offText, 'Off — enable to configure');
    assert.equal(copy.helperText, null);
  });

  it('returns path when folder is set', () => {
    const copy = getDeliveryLocalColumnCopy(
      { total: 2, filled: 2, empty: 0, perRowComplete: true },
      '/out',
      { localEnabled: true },
    );
    assert.equal(copy.path, '/out');
    assert.equal(copy.helperText, SAVE_LOCALLY_NEW_FILES_COMPLETE_HINT);
    assert.equal(copy.showProgress, false);
  });
});

describe('getDeliveryPanelCopy', () => {
  it('delegates to local column copy when local enabled', () => {
    const copy = getDeliveryPanelCopy(null, null, { localEnabled: true });
    assert.equal(copy.folderButtonLabel, 'Choose folder…');
  });
});

describe('getDeliveryUploadStatusCopy', () => {
  it('returns ready message when upload connection is ready', () => {
    assert.equal(
      getDeliveryUploadStatusCopy({ ready: true, blockers: [] }),
      'Upload connection ready',
    );
  });

  it('returns first blocker when not ready', () => {
    assert.equal(
      getDeliveryUploadStatusCopy({ ready: false, blockers: ['Log in to DSA.'] }),
      'Upload connection: Log in to DSA.',
    );
  });
});

describe('getDeliverySetupModalType', () => {
  it('returns null for globus (inline Delivery controls)', () => {
    assert.equal(getDeliverySetupModalType('globus'), null);
  });

  it('returns null for dsa (DSA settings live in Configuration)', () => {
    assert.equal(getDeliverySetupModalType('dsa'), null);
  });
});

describe('getDeliverySetupButtonLabel', () => {
  it('returns setup label when not ready', () => {
    assert.equal(getDeliverySetupButtonLabel('dsa', false), 'Set up DSA…');
  });

  it('returns manage label when ready', () => {
    assert.equal(getDeliverySetupButtonLabel('globus', true), 'Manage Globus…');
  });
});
