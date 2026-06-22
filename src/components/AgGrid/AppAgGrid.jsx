import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useDispatch, useSelector } from "react-redux";

// Setup the community module
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

import {
  buildRowAfterNamingEdit,
  EDITABLE_NAMING_FIELDS,
} from "../../helpers/ag_grid_helpers";

import * as files_actions from '../../actions/files';

import {
  buildFileTableColumnDefs,
  defaultColDef,
  fileTableRowStyle,
  fileTableTheme,
  PATH_COLUMN_FIELDS,
} from '../../helpers/file_table_column_defs.js';

import './AppAgGrid.scss';

const AppAgGrid = (props) => {
  const file_rows = useSelector(state => state.files.file_rows);
  const reserved_cols = useSelector(state => state.files.reserved_columns);
  const file_cols = useSelector(state => state.files.file_columns);
  const config = useSelector(state => state.config);
  const processing = useSelector(state => state.files.processing);
  const disable_changes = useSelector(state => state.files.disable_changes);
  const gridRef = useRef(null);
  const dispatch = useDispatch();
  const pathColumnWidthsRef = useRef({});
  const resizeRafRef = useRef(null);
  const pendingResizeRefreshRef = useRef({ api: null, colIds: [] });

  const gridContext = useMemo(() => ({
    getPathColumnWidth: (colId) => pathColumnWidthsRef.current[colId],
  }), []);

  const [column_defs, set_column_defs] = useState([]);

  const validateRowData = (rows) => {
    if (!Array.isArray(rows)) {
      console.warn('file_rows is not an array:', rows);
      return [];
    }

    return rows.filter(row => {
      if (!row || typeof row !== 'object') {
        console.warn('Invalid row data:', row);
        return false;
      }

      if (!row.__reserved || typeof row.__reserved !== 'object') {
        console.warn('Row missing __reserved property:', row);
        return false;
      }

      return true;
    });
  };

  const validatedFileRows = validateRowData(file_rows);

  const {
    suppressMovableColumns,
    ensureDomOrder,
    suppressDragLeaveHidesColumns,
    enableCellTextSelection,
    undoRedoCellEditing,
    undoRedoCellEditingLimit
  } = props;

  useEffect(() => {
    const column_defs = buildFileTableColumnDefs({
      reservedCols: reserved_cols,
      fileCols: file_cols,
      config,
      mode: 'app',
      processing,
      disableChanges: disable_changes,
      dispatch,
    });
    set_column_defs(column_defs);
  }, [file_cols, reserved_cols, config, processing, disable_changes, dispatch]);

  useEffect(() => () => {
    if (resizeRafRef.current != null) {
      cancelAnimationFrame(resizeRafRef.current);
    }
  }, []);

  const schedulePathColumnRefresh = useCallback((api, colIds) => {
    if (!api || !colIds.length) return;
    pendingResizeRefreshRef.current = { api, colIds };
    if (resizeRafRef.current != null) return;
    resizeRafRef.current = requestAnimationFrame(() => {
      resizeRafRef.current = null;
      const { api: pendingApi, colIds: pendingColIds } = pendingResizeRefreshRef.current;
      pendingApi?.refreshCells({
        columns: pendingColIds,
        force: true,
        suppressFlash: true,
      });
    });
  }, []);

  const onColumnResized = useCallback((event) => {
    const columns = event.columns?.length
      ? event.columns
      : (event.column ? [event.column] : []);

    const pathCols = columns.filter((col) => PATH_COLUMN_FIELDS.has(col?.getColId?.()));
    if (!pathCols.length) return;

    const colIds = [];
    for (const col of pathCols) {
      const colId = col.getColId();
      colIds.push(colId);
      pathColumnWidthsRef.current[colId] = col.getActualWidth();
    }

    schedulePathColumnRefresh(event.api, colIds);
  }, [schedulePathColumnRefresh]);

  const onCellEditRequest = useCallback((event) => {
    const field = event.colDef?.field;
    if (!field || !EDITABLE_NAMING_FIELDS.has(field)) return;
    if (event.data?.__reserved?.processed !== 0) return;

    const row = buildRowAfterNamingEdit(event.data, field, event.newValue);
    dispatch({
      type: files_actions.UPDATE_FILE_ROW_WITHOUT_METADATA,
      payload: { idx: event.node.rowIndex, row },
    });
  }, [dispatch]);

  const getRowId = useCallback((params) => {
    return params.data?.__reserved?.uuid
      ?? params.data?.__reserved?.source?.path
      ?? String(params.node?.rowIndex ?? '');
  }, []);

  function getRowStyle(params) {
    if (params.data.__reserved && params.data.__reserved.progress === 100) {
      return {
        backgroundColor: 'lightgreen'
      }
    }
    if (params.data.__reserved && params.data.__reserved.error != null && String(params.data.__reserved.error).trim()) {
      return {
        backgroundColor: 'lightcoral'
      }
    }
    return {};
  }

  return (
    <div className={"ag-theme-quartz __ag-grid"}>
      <AgGridReact
        ref={gridRef}
        rowData={validatedFileRows}
        columnDefs={column_defs}
        defaultColDef={defaultColDef}
        context={gridContext}
        theme={fileTableTheme}
        rowStyle={fileTableRowStyle}
        suppressMovableColumns={suppressMovableColumns}
        suppressScrollOnNewData={true}
        ensureDomOrder={ensureDomOrder}
        suppressDragLeaveHidesColumns={suppressDragLeaveHidesColumns}
        enableCellTextSelection={enableCellTextSelection}
        undoRedoCellEditing={undoRedoCellEditing}
        undoRedoCellEditingLimit={undoRedoCellEditingLimit}
        readOnlyEdit={true}
        getRowId={getRowId}
        getRowStyle={getRowStyle}
        onCellEditRequest={onCellEditRequest}
        onColumnResized={onColumnResized}
      />
    </div>
  )
}

export default AppAgGrid;
