import React, { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { useSelector, useDispatch } from "react-redux";

import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

import { buildStagingSlides } from "../../helpers/esm_results_filter";
import { getActiveProfile } from "../../helpers/esm_profile_helpers";
import { buildEsmStagingColumnDefs } from "../../helpers/esm_staging_column_defs";
import {
  defaultColDef,
  fileTableRowStyle,
  fileTableTheme,
} from "../../helpers/file_table_column_defs.js";

import "./ESMAgGrid.scss";
import "./AppAgGrid.scss";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import * as esm_actions from "../../actions/esm";

export default function ESMAgGrid(props) {
  const dispatch = useDispatch();
  const gridRef = React.useRef(null);

  const esmState = useSelector((state) => state.esm);
  const profile = getActiveProfile(esmState);
  const searchRows = esmState.searchRows;
  const slidesByAccession = esmState.slidesByAccession;
  const selectedIds = esmState.selectedIds;

  const rows = useMemo(
    () =>
      buildStagingSlides({
        searchRows,
        slidesByAccession,
        profile,
      }),
    [searchRows, slidesByAccession, profile],
  );

  const columnDefs = useMemo(
    () => buildEsmStagingColumnDefs(profile),
    [profile],
  );

  React.useEffect(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    api.forEachNode((node) => {
      const id = node?.data?.__esm?.id;
      if (!id) return;
      node.setSelected(selectedIds.includes(id));
    });
  }, [selectedIds, rows]);

  function onSelectionChanged() {
    const api = gridRef.current?.api;
    if (!api) return;
    const ids = api.getSelectedNodes().map((n) => n?.data?.__esm?.id).filter(Boolean);
    dispatch({ type: esm_actions.ESM_SET_SELECTION, payload: ids });
  }

  const {
    suppressMovableColumns,
    ensureDomOrder,
    suppressDragLeaveHidesColumns,
    enableCellTextSelection,
  } = props;

  return (
    <div className={"ag-theme-quartz __ag-grid __esm-ag-grid"}>
      <AgGridReact
        ref={gridRef}
        rowData={rows}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        theme={fileTableTheme}
        rowStyle={fileTableRowStyle}
        rowSelection={"multiple"}
        onSelectionChanged={onSelectionChanged}
        suppressRowClickSelection={true}
        suppressScrollOnNewData={true}
        suppressMovableColumns={suppressMovableColumns}
        ensureDomOrder={ensureDomOrder}
        suppressDragLeaveHidesColumns={suppressDragLeaveHidesColumns}
        enableCellTextSelection={enableCellTextSelection}
        tooltipShowDelay={100}
      />
    </div>
  );
}
