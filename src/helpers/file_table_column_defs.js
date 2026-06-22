// helpers/file_table_column_defs.js — shared column-def pipeline for app + preview grids.

import { themeQuartz } from 'ag-grid-community';

import {
  setupRemoveColumn,
  setupSourceFileColumn,
  setupAssociatedImagesColumn,
  setupDestinationDirectoryColumn,
  setupProgressColumn,
  setup_source_directory_cell_renderer,
  setup_source_directory_cell_class,
  setupSizeValueFormatter,
  setupAssociatedImagesValueFormatter,
  setupAssociatedImagesComparator,
  setupDestinationDirectoryCellClass,
  setupDestinationDirectoryOnCellClicked,
  setupRenameCellEditable,
  setupRenameCellClass,
  setupRenameCellOnCellClicked,
  setupRenameCellRenderer,
  setupRenameCellEditor,
  setupRenameValueGetter,
  setupRenameSingleClickEdit,
  setupOverflowTextRenderer,
  setupNamingFieldEditable,
  setupNamingFieldCellClass,
  setupNamingFieldSingleClickEdit,
  applyOutputPreviewColumnTweaks,
} from './ag_grid_helpers.jsx';
import {
  applyFileTableColumnProfile,
  applyPreviewFixedColumnWidths,
  filterFileTableColumns,
  filterPreviewOmittedColumns,
  filterRemoveColumnForPreview,
} from './file_table_columns.js';
import GridTooltipInnerHeader from '../components/AgGrid/GridTooltipInnerHeader.jsx';

export const PATH_COLUMN_FIELDS = new Set([
  '__reserved.source.directory',
  '__reserved.destinationDirectory',
]);

export const fileTableTheme = themeQuartz.withParams({
  headerColumnBorder: true,
  columnBorder: true,
});

export const defaultColDef = {
  resizable: true,
  sortable: true,
  suppressSizeToFit: true,
  wrapText: false,
  headerComponentParams: {
    innerHeaderComponent: GridTooltipInnerHeader,
  },
};

export const previewDefaultColDef = {
  ...defaultColDef,
  resizable: false,
};

export const fileTableRowStyle = {
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
};

export const previewGridLayoutProps = {
  ensureDomOrder: true,
  suppressScrollOnNewData: true,
  suppressColumnVirtualisation: true,
  suppressMovableColumns: true,
  enableCellTextSelection: true,
  undoRedoCellEditing: true,
  undoRedoCellEditingLimit: 20,
};

export function namingFieldsForConfig(labelConfig) {
  const fields = ['__reserved.labelText'];
  if (labelConfig?.add_qr !== false) {
    fields.push('__reserved.qrPayload');
  }
  return fields;
}

const PREVIEW_NO_CLICK_FIELDS = new Set([
  '__reserved.source.filename',
  '__reserved.destinationDirectory',
  '__reserved.rename',
]);

function stripPreviewCellClicks(columnDefs) {
  return columnDefs.map((col) => {
    if (!PREVIEW_NO_CLICK_FIELDS.has(col.field)) return col;
    const { onCellClicked, ...rest } = col;
    return rest;
  });
}

export function buildFileTableColumnDefs({
  reservedCols,
  fileCols,
  config,
  mode = 'app',
  processing = false,
  disableChanges = false,
  dispatch = null,
}) {
  const isPreview = mode === 'preview' || mode === 'previewOutputFilename';
  let allCols = filterFileTableColumns([...reservedCols, ...fileCols], {
    labelConfig: config?.label,
  });

  if (isPreview) {
    allCols = filterRemoveColumnForPreview(allCols);
    allCols = filterPreviewOmittedColumns(allCols);
  }

  let columnDefs = applyFileTableColumnProfile(allCols);

  if (!isPreview) {
    columnDefs = setupRemoveColumn(columnDefs, processing, disableChanges, dispatch);
  }

  columnDefs = setupSourceFileColumn(columnDefs);
  columnDefs = setupAssociatedImagesColumn(columnDefs);
  columnDefs = setupDestinationDirectoryColumn(columnDefs);
  columnDefs = setupProgressColumn(columnDefs);
  columnDefs = setup_source_directory_cell_renderer(columnDefs);
  columnDefs = setup_source_directory_cell_class(columnDefs);
  columnDefs = setupSizeValueFormatter(columnDefs);
  columnDefs = setupAssociatedImagesValueFormatter(columnDefs);
  columnDefs = setupAssociatedImagesComparator(columnDefs);
  columnDefs = setupDestinationDirectoryCellClass(columnDefs);

  if (!isPreview && dispatch) {
    columnDefs = setupDestinationDirectoryOnCellClicked(columnDefs, dispatch);
  }

  columnDefs = setupRenameCellEditable(columnDefs);
  columnDefs = setupRenameCellEditor(columnDefs);
  columnDefs = setupRenameValueGetter(columnDefs, config);
  columnDefs = setupRenameSingleClickEdit(columnDefs);
  columnDefs = setupRenameCellClass(columnDefs);

  if (!isPreview) {
    columnDefs = setupRenameCellOnCellClicked(columnDefs);
  }

  columnDefs = setupRenameCellRenderer(columnDefs, config);

  for (const field of namingFieldsForConfig(config?.label)) {
    columnDefs = setupNamingFieldEditable(columnDefs, field);
    columnDefs = setupNamingFieldSingleClickEdit(columnDefs, field);
    columnDefs = setupNamingFieldCellClass(columnDefs, field);
  }

  columnDefs = setupOverflowTextRenderer(columnDefs);

  if (isPreview) {
    columnDefs = stripPreviewCellClicks(columnDefs);
    columnDefs = applyPreviewFixedColumnWidths(columnDefs);
    if (mode === 'previewOutputFilename') {
      columnDefs = applyOutputPreviewColumnTweaks(columnDefs, fileCols);
    }
  }

  return columnDefs;
}
