import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  PATH_COLUMN_ICON_THRESHOLD,
  isPathColumnIconMode,
  filterFileTableColumns,
  shouldHideQrColumn,
  applyPreviewFixedColumnWidths,
  estimateColumnDefsTotalWidth,
  filterPreviewOmittedColumns,
  PREVIEW_OMITTED_COLUMN_FIELDS,
  applyAgGridColumnProfile,
  applyFileTableColumnProfile,
  DEFAULT_DYNAMIC_COLUMN,
  FILE_TABLE_COLUMN_PROFILE,
} from './file_table_columns.js';

describe('isPathColumnIconMode', () => {
  it('returns true when column width is below threshold', () => {
    const column = { getActualWidth: () => PATH_COLUMN_ICON_THRESHOLD - 1 };
    assert.equal(isPathColumnIconMode(column), true);
  });

  it('returns false when column width is at or above threshold', () => {
    const atThreshold = { getActualWidth: () => PATH_COLUMN_ICON_THRESHOLD };
    const aboveThreshold = { getActualWidth: () => PATH_COLUMN_ICON_THRESHOLD + 20 };
    assert.equal(isPathColumnIconMode(atThreshold), false);
    assert.equal(isPathColumnIconMode(aboveThreshold), false);
  });

  it('defaults to text mode when column width is unavailable', () => {
    assert.equal(isPathColumnIconMode(null), false);
    assert.equal(isPathColumnIconMode({}), false);
  });

  it('prefers live width from grid context during resize', () => {
    const column = {
      getColId: () => '__reserved.source.directory',
      getActualWidth: () => 40,
    };
    const context = {
      getPathColumnWidth: (colId) => (
        colId === '__reserved.source.directory' ? PATH_COLUMN_ICON_THRESHOLD : undefined
      ),
    };
    assert.equal(isPathColumnIconMode(column, context), false);
  });
});

describe('filterFileTableColumns', () => {
  const columns = [
    { field: '__reserved.rename' },
    { field: '__reserved.labelText' },
    { field: '__reserved.qrPayload' },
  ];

  it('hides QR column when label QR is disabled', () => {
    const filtered = filterFileTableColumns(columns, { labelConfig: { add_qr: false } });
    const fields = filtered.map((col) => col.field);
    assert.equal(fields.includes('__reserved.qrPayload'), false);
    assert.equal(fields.includes('__reserved.labelText'), true);
  });

  it('shows QR column when label QR is enabled', () => {
    const filtered = filterFileTableColumns(columns, { labelConfig: { add_qr: true } });
    assert.equal(filtered.some((col) => col.field === '__reserved.qrPayload'), true);
  });
});

describe('shouldHideQrColumn', () => {
  it('returns true only when add_qr is explicitly false', () => {
    assert.equal(shouldHideQrColumn({ add_qr: false }), true);
    assert.equal(shouldHideQrColumn({ add_qr: true }), false);
    assert.equal(shouldHideQrColumn(undefined), false);
  });
});

describe('filterPreviewOmittedColumns', () => {
  it('removes Path, Copy To, and Progress from preview', () => {
    const cols = [
      { field: '__reserved.source.directory' },
      { field: '__reserved.source.filename' },
      { field: '__reserved.associatedImages' },
      { field: '__reserved.destinationDirectory' },
      { field: '__reserved.rename' },
      { field: '__reserved.progress' },
    ];
    const filtered = filterPreviewOmittedColumns(cols);
    const fields = filtered.map((col) => col.field);
    assert.equal(fields.includes('__reserved.source.directory'), false);
    assert.equal(fields.includes('__reserved.destinationDirectory'), false);
    assert.equal(fields.includes('__reserved.progress'), false);
    assert.equal(fields.includes('__reserved.source.filename'), true);
    assert.equal(fields.includes('__reserved.associatedImages'), true);
    assert.equal(fields.includes('__reserved.rename'), true);
  });

  it('PREVIEW_OMITTED_COLUMN_FIELDS matches expected set', () => {
    assert.equal(PREVIEW_OMITTED_COLUMN_FIELDS.has('__reserved.source.directory'), true);
    assert.equal(PREVIEW_OMITTED_COLUMN_FIELDS.has('__reserved.destinationDirectory'), true);
    assert.equal(PREVIEW_OMITTED_COLUMN_FIELDS.has('__reserved.progress'), true);
    assert.equal(PREVIEW_OMITTED_COLUMN_FIELDS.size, 3);
  });
});

describe('applyPreviewFixedColumnWidths', () => {
  it('removes flex and pinned, sets explicit width', () => {
    const cols = [
      { field: '__reserved.rename', flex: 2, minWidth: 140 },
      { field: '__reserved.progress', width: 120, pinned: 'right' },
    ];
    const fixed = applyPreviewFixedColumnWidths(cols);
    assert.equal(fixed[0].width, 180);
    assert.equal(fixed[0].minWidth, 180);
    assert.equal(fixed[0].maxWidth, 180);
    assert.equal(fixed[0].resizable, false);
    assert.equal(fixed[0].flex, undefined);
    assert.equal(fixed[1].width, 120);
    assert.equal(fixed[1].pinned, undefined);
    assert.equal(fixed[1].suppressSizeToFit, true);
  });

  it('widens Original file column to 200px', () => {
    const cols = [
      { field: '__reserved.source.filename', minWidth: 160 },
    ];
    const fixed = applyPreviewFixedColumnWidths(cols);
    assert.equal(fixed[0].width, 200);
  });

  it('uses preview width profile for naming columns', () => {
    const cols = [
      { field: '__reserved.rename', minWidth: 140 },
      { field: '__reserved.labelText', minWidth: 120 },
      { field: '__reserved.qrPayload', minWidth: 120 },
    ];
    const fixed = applyPreviewFixedColumnWidths(cols);
    assert.equal(fixed[0].width, 180);
    assert.equal(fixed[1].width, 160);
    assert.equal(fixed[2].width, 180);
  });
});

describe('estimateColumnDefsTotalWidth', () => {
  it('sums column widths', () => {
    const cols = [
      { field: 'a', width: 58 },
      { field: 'b', minWidth: 76 },
      { field: 'c' },
    ];
    assert.equal(estimateColumnDefsTotalWidth(cols), 58 + 76 + 100);
  });
});

describe('applyAgGridColumnProfile', () => {
  it('applies DEFAULT_DYNAMIC_COLUMN to unknown fields', () => {
    const cols = applyAgGridColumnProfile(
      [{ field: 'CustomCol', headerName: 'Custom' }],
      {},
    );
    assert.deepEqual(cols[0].flex, DEFAULT_DYNAMIC_COLUMN.flex);
    assert.equal(cols[0].minWidth, DEFAULT_DYNAMIC_COLUMN.minWidth);
    assert.equal(cols[0].headerTooltipText, 'CustomCol');
  });

  it('resolves profile via colId when field is absent', () => {
    const profile = { MyCol: { minWidth: 88, flex: 0 } };
    const cols = applyAgGridColumnProfile(
      [{ colId: 'MyCol', headerName: 'My Col' }],
      profile,
    );
    assert.equal(cols[0].minWidth, 88);
    assert.equal(cols[0].flex, 0);
  });
});

describe('applyFileTableColumnProfile', () => {
  it('delegates to applyAgGridColumnProfile for known reserved fields', () => {
    const cols = applyFileTableColumnProfile([{ field: '__reserved.rename' }]);
    assert.equal(cols[0].minWidth, FILE_TABLE_COLUMN_PROFILE['__reserved.rename'].minWidth);
    assert.equal(cols[0].flex, FILE_TABLE_COLUMN_PROFILE['__reserved.rename'].flex);
  });
});
