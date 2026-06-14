import React, { useState, useEffect, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useDispatch, useSelector } from "react-redux";

// Setup the community module
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

import {
  setupRemoveColumn,
  setupThumbnailColumnCellRenderer,
  setupThumbnailColumnOnCellClicked,
  setupAssociatedImagesColumn,
  setupDestinationDirectoryColumn,
  setupProgressColumn,
  setup_source_directory_cell_renderer,
  setupSizeValueFormatter,
  setupAssociatedImagesValueFormatter,
  setupAssociatedImagesComparator,
  setupDestinationDirectoryCellClass,
  setupDestinationDirectoryColSpan,
  setupDestinationDirectoryOnCellClicked,
  setupRenameEditorColumn,
  setupRenameCellEditable,
  setupRenameCellClass,
  setupRenameCellOnCellClicked,
  setupRenameCellValueSetter,
  setupRenameCellRenderer,
  setupTooltipValueGetter

} from "../../helpers/ag_grid_helpers";

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

  const [column_defs, set_column_defs] = useState([]);

  // Validate and filter row data to prevent AG Grid errors
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
  let all_cols = [...reserved_cols, ...file_cols];

  const {
    autoSizeStrategy,
    suppressMovableColumns,
    ensureDomOrder,
    suppressDragLeaveHidesColumns,
    enableCellTextSelection,
    undoRedoCellEditing,
    undoRedoCellEditingLimit
  } = props;

  useEffect(() => {
    let column_defs = setupRemoveColumn(all_cols, processing, disable_changes, dispatch);
    column_defs = setupThumbnailColumnCellRenderer(column_defs);
    column_defs = setupThumbnailColumnOnCellClicked(column_defs);
    column_defs = setupAssociatedImagesColumn(column_defs);
    column_defs = setupDestinationDirectoryColumn(column_defs);
    column_defs = setupProgressColumn(column_defs);
    // column_defs = setupSourceDirValueFormater(column_defs);
    column_defs = setup_source_directory_cell_renderer(column_defs);
    column_defs = setupSizeValueFormatter(column_defs);
    column_defs = setupAssociatedImagesValueFormatter(column_defs);
    column_defs = setupAssociatedImagesComparator(column_defs);
    // column_defs = setupDestinationDirectoryCellClass(column_defs);
    column_defs = setupDestinationDirectoryColumn(column_defs);
    // column_defs = setupDestinationDirectoryColSpan(column_defs);
    column_defs = setupDestinationDirectoryOnCellClicked(column_defs);
    column_defs = setupRenameCellEditable(column_defs);
    column_defs = setupRenameCellClass(column_defs);
    column_defs = setupRenameCellOnCellClicked(column_defs);
    column_defs = setupRenameCellValueSetter(column_defs, dispatch);
    column_defs = setupRenameEditorColumn(column_defs, config);
    column_defs = setupRenameCellRenderer(column_defs, config);
    column_defs = setupTooltipValueGetter(column_defs);
    set_column_defs(column_defs);
  }, [file_cols, config, reserved_cols]);

  function getRowStyle(params) {
    if (params.data.__reserved && params.data.__reserved.progress === 100) {
      return {
        backgroundColor: 'lightgreen'
      }
    }
    if (params.data.__reserved && params.data.__reserved.error) {
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
        theme={themeQuartz}
        rowStyle={{
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
        autoSizeStrategy={autoSizeStrategy}
        suppressMovableColumns={suppressMovableColumns}
        suppressScrollOnNewData={true}
        ensureDomOrder={ensureDomOrder}
        suppressDragLeaveHidesColumns={suppressDragLeaveHidesColumns}
        enableCellTextSelection={enableCellTextSelection}
        undoRedoCellEditing={undoRedoCellEditing}
        undoRedoCellEditingLimit={undoRedoCellEditingLimit}
        getRowStyle={getRowStyle}
        tooltipShowDelay={100}
      // suppressModelUpdateAfterUpdateTransaction={true}
      // suppressRowTransform={true}
      // suppressColumnVirtualisation={false}
      // suppressRowVirtualisation={false}
      // suppressAnimationFrame={false}
      />
    </div>
  )
}

export default AppAgGrid;