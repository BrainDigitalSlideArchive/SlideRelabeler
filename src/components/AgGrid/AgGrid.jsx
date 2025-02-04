import React, {useState, useEffect} from 'react';
import { AgGridReact } from 'ag-grid-react';
import {useDispatch, useSelector} from "react-redux";

import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme
import "./AgGrid.scss";

import {
  setupRemoveColumn,
  setupThumbnailColumnCellRenderer,
  setupThumbnailColumnOnCellClicked,
  setupAssociatedImagesColumn,
  setupDestinationDirectoryColumn,
  setupProgressColumn,
  setupRenameEditorColumn,
  setupSourceDirValueFormater,
  setupSizeValueFormatter,
  setupAssociatedImagesValueFormatter,
  setupAssociatedImagesComparator,
  setupDestinationDirectoryCellClass,
  setupDestinationDirectoryColSpan,
  setupDestinationDirectoryOnCellClicked,
  setupRenameCellEditable,
  setupRenameCellClass,
  setupRenameCellOnCellClicked,
  setupRenameCellValueSetter

} from "../../helpers/ag_grid_helpers";

import './AgGrid.scss';


const AgGrid = (props) => {
  const fileRows = useSelector(state => state.files.fileRows);
  const fileCols = useSelector(state => state.files.fileCols);
  const filename_config = useSelector(state => state.config.filename);
  const dispatch= useDispatch();

  const [columnDefs, setColumnDefs] = useState([]);

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
    let columnDefs = setupRemoveColumn(fileCols, dispatch);
    columnDefs = setupThumbnailColumnCellRenderer(columnDefs);
    columnDefs = setupThumbnailColumnOnCellClicked(columnDefs);
    columnDefs = setupAssociatedImagesColumn(columnDefs);
    columnDefs = setupDestinationDirectoryColumn(columnDefs);
    columnDefs = setupProgressColumn(columnDefs);
    columnDefs = setupSourceDirValueFormater(columnDefs);
    columnDefs = setupSizeValueFormatter(columnDefs);
    columnDefs = setupAssociatedImagesValueFormatter(columnDefs);
    columnDefs = setupAssociatedImagesComparator(columnDefs);
    columnDefs = setupDestinationDirectoryCellClass(columnDefs);
    columnDefs = setupDestinationDirectoryColumn(columnDefs);
    columnDefs = setupDestinationDirectoryColSpan(columnDefs);
    columnDefs = setupDestinationDirectoryOnCellClicked(columnDefs);
    columnDefs = setupRenameCellEditable(columnDefs, filename_config);
    columnDefs = setupRenameCellClass(columnDefs);
    columnDefs = setupRenameCellOnCellClicked(columnDefs);
    columnDefs = setupRenameCellValueSetter(columnDefs, dispatch);
    columnDefs = setupRenameEditorColumn(columnDefs, filename_config);
    setColumnDefs(columnDefs);
  }, [fileCols, fileRows, filename_config]);

  return (
    <div className={"ag-theme-quartz __ag-grid"}>
      <AgGridReact
        rowData={fileRows}
        columnDefs={columnDefs}
        autoSizeStrategy={autoSizeStrategy}
        suppressMovableColumns={suppressMovableColumns}
        ensureDomOrder={ensureDomOrder}
        suppressDragLeaveHidesColumns={suppressDragLeaveHidesColumns}
        enableCellTextSelection = {enableCellTextSelection}
        undoRedoCellEditing = {undoRedoCellEditing}
        undoRedoCellEditingLimit = {undoRedoCellEditingLimit}
      />
    </div>
  )
}

export default AgGrid;