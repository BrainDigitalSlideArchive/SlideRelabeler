// helpers/file_table_columns.js — column visibility and sizing for the main file table grid.

export const HIDDEN_FILE_TABLE_COLUMN_FIELDS = new Set([
  'AssembledName',
  '__reserved.source.path',
]);

export const QR_PAYLOAD_FIELD = '__reserved.qrPayload';

export const REMOVE_ROW_HEADER_CLASS = 'remove-row';

/** Below this width (px), directory/copy-to columns show folder icon instead of path text. */
export const PATH_COLUMN_ICON_THRESHOLD = 72;

export function isPathColumnIconMode(column, context) {
  const colId = column?.getColId?.();
  const contextWidth = colId && context?.getPathColumnWidth?.(colId);
  const w = contextWidth ?? column?.getActualWidth?.() ?? 999;
  return w < PATH_COLUMN_ICON_THRESHOLD;
}

/** Declarative sizing/header profile keyed by field or remove-row headerClass. */
export const FILE_TABLE_COLUMN_PROFILE = {
  [REMOVE_ROW_HEADER_CLASS]: {
    width: 28,
    minWidth: 28,
    maxWidth: 28,
    resizable: false,
    sortable: false,
    pinned: 'left',
    headerName: '',
    suppressSizeToFit: true,
    cellClass: 'remove-row __cell-icon',
    headerClass: REMOVE_ROW_HEADER_CLASS,
  },
  '__reserved.source.directory': {
    width: 58,
    minWidth: 44,
    flex: 0,
    headerName: 'Path',
    headerTooltipText: 'Path to original file',
    suppressSizeToFit: true,
    cellClass: 'cell-container directory left-ellipsis',
  },
  '__reserved.source.filename': {
    minWidth: 160,
    maxWidth: 280,
    flex: 0,
    headerName: 'Original file',
    headerTooltipText: 'Original file name. Click to open in viewer.',
    suppressSizeToFit: true,
    cellClass: 'cell-container __cell-compact filename source-file',
  },
  '__reserved.bytes': {
    width: 76,
    minWidth: 76,
    maxWidth: 76,
    resizable: false,
    headerName: 'Size',
    headerTooltipText: 'File size',
    suppressSizeToFit: true,
    cellClass: 'cell-container __cell-compact',
  },
  '__reserved.associatedImages': {
    width: 72,
    minWidth: 72,
    maxWidth: 72,
    resizable: false,
    headerName: 'Images',
    headerTooltipText: 'Associated images',
    suppressSizeToFit: true,
    cellClass: 'associated-images __cell-icon',
  },
  '__reserved.destinationDirectory': {
    width: 78,
    minWidth: 44,
    flex: 0,
    headerName: 'Copy To',
    headerTooltipText: 'Copy to destination directory',
    suppressSizeToFit: true,
    cellClass: 'cell-container directory left-ellipsis',
  },
  '__reserved.rename': {
    flex: 2,
    minWidth: 140,
    headerName: 'Output name',
    headerTooltipText: 'Output file name',
    cellClass: 'cell-container __cell naming-field',
  },
  '__reserved.labelText': {
    flex: 1,
    minWidth: 120,
    headerName: 'Label',
    headerTooltipText: 'Label text',
    cellClass: 'cell-container __cell naming-field',
  },
  '__reserved.qrPayload': {
    flex: 1,
    minWidth: 120,
    headerName: 'QR',
    headerTooltipText: 'QR code content',
    cellClass: 'cell-container __cell naming-field',
  },
  '__reserved.progress': {
    width: 120,
    minWidth: 120,
    maxWidth: 120,
    resizable: false,
    pinned: 'right',
    headerName: 'Progress',
    headerTooltipText: 'Processing progress',
    suppressSizeToFit: true,
    cellClass: 'cell-container __full-cell',
  },
};

const DEFAULT_DYNAMIC_COLUMN = {
  flex: 1,
  minWidth: 100,
};

function profileKeyForColumn(col) {
  if (col?.headerClass === REMOVE_ROW_HEADER_CLASS) return REMOVE_ROW_HEADER_CLASS;
  return col?.field ?? null;
}

export function shouldHideQrColumn(labelConfig) {
  return labelConfig?.add_qr === false;
}

export function isHiddenFileTableColumn(field, options = {}) {
  if (!field || typeof field !== 'string') return false;
  if (HIDDEN_FILE_TABLE_COLUMN_FIELDS.has(field)) return true;
  if (field === QR_PAYLOAD_FIELD && shouldHideQrColumn(options.labelConfig)) return true;
  return false;
}

export function filterFileTableColumns(columns, options = {}) {
  return (columns || []).filter((col) => !isHiddenFileTableColumn(col?.field, options));
}

export function filterRemoveColumnForPreview(allCols) {
  return (allCols || []).filter((col) => col.headerClass !== REMOVE_ROW_HEADER_CLASS);
}

export const PREVIEW_OMITTED_COLUMN_FIELDS = new Set([
  '__reserved.source.directory',
  '__reserved.destinationDirectory',
  '__reserved.progress',
]);

export function filterPreviewOmittedColumns(allCols) {
  return (allCols || []).filter(
    (col) => !PREVIEW_OMITTED_COLUMN_FIELDS.has(col.field),
  );
}

const PREVIEW_COLUMN_WIDTHS = {
  '__reserved.source.filename': 200,
  '__reserved.bytes': 76,
  '__reserved.associatedImages': 72,
  '__reserved.rename': 180,
  '__reserved.labelText': 160,
  '__reserved.qrPayload': 180,
};

export function applyPreviewFixedColumnWidths(columnDefs) {
  return (columnDefs || []).map((col) => {
    const width = PREVIEW_COLUMN_WIDTHS[col.field]
      ?? col.width
      ?? col.minWidth
      ?? 120;
    const { flex, pinned, ...rest } = col;
    return {
      ...rest,
      width,
      minWidth: width,
      maxWidth: width,
      resizable: false,
      suppressSizeToFit: true,
    };
  });
}

export function estimateColumnDefsTotalWidth(columnDefs) {
  return (columnDefs || []).reduce(
    (sum, col) => sum + (col.width ?? col.minWidth ?? 100),
    0,
  );
}

/**
 * Merge FILE_TABLE_COLUMN_PROFILE onto column defs.
 */
export function applyFileTableColumnProfile(columns) {
  return (columns || []).map((col) => {
    const key = profileKeyForColumn(col);
    const profile = key ? FILE_TABLE_COLUMN_PROFILE[key] : null;

    if (!profile) {
      if (!col?.field) return col;
      return { ...col, ...DEFAULT_DYNAMIC_COLUMN, headerTooltipText: col.field };
    }

    return { ...col, ...profile };
  });
}
