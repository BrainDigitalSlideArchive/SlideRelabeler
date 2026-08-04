import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

import {
  buildFileTableColumnDefs,
  fileTableRowStyle,
  fileTableTheme,
  previewDefaultColDef,
  previewGridLayoutProps,
} from '../../helpers/file_table_column_defs.js';
import { estimateColumnDefsTotalWidth } from '../../helpers/file_table_columns.js';
import {
  buildRowAfterNamingEdit,
  EDITABLE_NAMING_FIELDS,
} from '../../helpers/ag_grid_helpers';
import { applyRowNamingDefaults } from '../../helpers/row_naming_defaults.js';
import {
  clearManualRenameOverride,
  isManualRenameOverride,
  updatePreviewRowCell,
} from '../../helpers/config_preview_row.js';
import PreviewRenameOverrideCallout from './PreviewRenameOverrideCallout.jsx';

import '../../components/AgGrid/AppAgGrid.scss';

function applyPreviewColumnWidths(api, columnDefs) {
  const widths = columnDefs
    .filter((col) => col.field && col.width)
    .map((col) => ({ key: col.field, newWidth: col.width }));
  if (widths.length) {
    api.setColumnWidths(widths);
  }
}

function appendCellClass(existing, extra) {
  if (typeof existing === 'function') {
    return (params) => {
      const base = existing(params);
      return [base, extra].filter(Boolean).join(' ');
    };
  }
  return [existing, extra].filter(Boolean).join(' ');
}

function appendHeaderClass(existing, extra) {
  return [existing, extra].filter(Boolean).join(' ');
}

function applyHighlightColumnFields(columnDefs, highlightColumnFields) {
  if (!highlightColumnFields?.length) return columnDefs;
  const highlightSet = new Set(highlightColumnFields);
  return columnDefs.map((col) => {
    if (!highlightSet.has(col.field)) return col;
    return {
      ...col,
      headerClass: appendHeaderClass(col.headerClass, 'preview-column-highlight'),
      cellClass: appendCellClass(col.cellClass, 'preview-column-highlight'),
    };
  });
}

export default function ConfigPreviewRowEditor({
  previewRow,
  config,
  reservedColumns = [],
  fileCols = [],
  disabled,
  onRowChange,
  highlightColumnFields = [],
  variant,
}) {
  const gridContainerRef = useRef(null);
  const [repositionToken, setRepositionToken] = useState(0);
  const isOutputFilename = variant === 'outputFilename';

  const columnDefs = useMemo(
    () => applyHighlightColumnFields(
      buildFileTableColumnDefs({
        reservedCols: reservedColumns,
        fileCols,
        config,
        mode: isOutputFilename ? 'previewOutputFilename' : 'preview',
      }),
      highlightColumnFields,
    ),
    [reservedColumns, fileCols, config, highlightColumnFields, isOutputFilename],
  );

  const estimatedMinWidth = useMemo(
    () => estimateColumnDefsTotalWidth(columnDefs),
    [columnDefs],
  );

  const rowData = useMemo(
    () => (previewRow ? [previewRow] : []),
    [previewRow],
  );

  const bumpCalloutPosition = useCallback(() => {
    setRepositionToken((token) => token + 1);
  }, []);

  const lockColumnWidths = useCallback((event) => {
    applyPreviewColumnWidths(event.api, columnDefs);
    bumpCalloutPosition();
  }, [columnDefs, bumpCalloutPosition]);

  const handleCellEditRequest = useCallback((event) => {
    const field = event.colDef?.field;
    if (!field || event.data?.__reserved?.processed !== 0) return;

    if (isOutputFilename) {
      if (field === '__reserved.labelText' || field === '__reserved.qrPayload') return;

      if (field === '__reserved.rename') {
        const trimmed = event.newValue != null ? String(event.newValue).trim() : '';
        if (trimmed === '') {
          onRowChange?.(clearManualRenameOverride(event.data, config));
          bumpCalloutPosition();
          return;
        }
        let updatedRow = buildRowAfterNamingEdit(event.data, field, event.newValue);
        updatedRow = applyRowNamingDefaults(updatedRow, config);
        onRowChange?.(updatedRow);
        bumpCalloutPosition();
        return;
      }

      if (!field.startsWith('__')) {
        onRowChange?.(updatePreviewRowCell(event.data, field, event.newValue, config));
        return;
      }
      return;
    }

    if (!EDITABLE_NAMING_FIELDS.has(field)) return;

    let updatedRow = buildRowAfterNamingEdit(event.data, field, event.newValue);
    updatedRow = applyRowNamingDefaults(updatedRow, config);
    onRowChange?.(updatedRow);
  }, [config, onRowChange, isOutputFilename, bumpCalloutPosition]);

  const handleClearOverride = useCallback(() => {
    if (!previewRow) return;
    onRowChange?.(clearManualRenameOverride(previewRow, config));
    bumpCalloutPosition();
  }, [previewRow, config, onRowChange, bumpCalloutPosition]);

  const getRowId = useCallback(() => 'preview-row', []);

  const gridClassName = [
    'config-preview-row-editor__grid',
    isOutputFilename ? 'config-preview-row-editor__grid--output-filename' : null,
    isOutputFilename && isManualRenameOverride(previewRow)
      ? 'config-preview-row-editor__grid--has-override-callout'
      : null,
  ].filter(Boolean).join(' ');

  return (
    <div className="config-preview-row-editor">
      <div ref={gridContainerRef} className={gridClassName}>
        <div
          className="ag-theme-quartz __ag-grid config-preview-row-editor__grid-mount"
          style={{ width: estimatedMinWidth }}
        >
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={previewDefaultColDef}
            theme={fileTableTheme}
            readOnlyEdit
            stopEditingWhenCellsLoseFocus={true}
            rowStyle={fileTableRowStyle}
            onCellEditRequest={handleCellEditRequest}
            onGridReady={lockColumnWidths}
            onFirstDataRendered={lockColumnWidths}
            onBodyScroll={bumpCalloutPosition}
            onColumnResized={bumpCalloutPosition}
            getRowId={getRowId}
            {...previewGridLayoutProps}
          />
        </div>
        {isOutputFilename && (
          <PreviewRenameOverrideCallout
            containerRef={gridContainerRef}
            previewRow={previewRow}
            onClear={handleClearOverride}
            repositionToken={repositionToken}
          />
        )}
      </div>
    </div>
  );
}
