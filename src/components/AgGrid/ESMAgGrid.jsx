import React, { useMemo, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { useDispatch, useSelector } from "react-redux";

import { ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

import { computeAccessionToken, buildBaseFilename } from "../../helpers/esm_filename_helpers";

import { applyRules, getSelectedTransformRules } from "../../helpers/esm_transform_rules";
import { buildStagingSlides } from "../../helpers/esm_results_filter";

import "./ESMAgGrid.scss";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import * as esm_actions from "../../actions/esm";

export default function ESMAgGrid(props) {
  const dispatch = useDispatch();
  const gridRef = useRef(null);

  const searchRows = useSelector((state) => state.esm.searchRows);
  const slidesByAccession = useSelector((state) => state.esm.slidesByAccession);
  const selectedIds = useSelector((state) => state.esm.selectedIds);
  const mappingConfig = useSelector((state) => state.esm.mappingConfig);
  const transformRules = useSelector((state) => state.esm.transformRules) || [];
  const selectedTransformRuleIds = useSelector((state) => state.esm.selectedTransformRuleIds) || [];

  const selectedRules = useMemo(
    () => getSelectedTransformRules(transformRules, selectedTransformRuleIds),
    [transformRules, selectedTransformRuleIds],
  );

  const rows = useMemo(
    () =>
      buildStagingSlides({
        searchRows,
        slidesByAccession,
        mappingConfig,
        transformRules,
        selectedTransformRuleIds,
      }),
    [searchRows, slidesByAccession, mappingConfig, transformRules, selectedTransformRuleIds],
  );

  const columnDefs = useMemo(() => {
    return [
      {
        headerName: "",
        field: "__select",
        width: 44,
        pinned: "left",
        checkboxSelection: true,
        headerCheckboxSelection: true,
        sortable: false,
        filter: false,
        resizable: false,
      },
      { headerName: "Accession", field: "Accession", sortable: true, filter: true },
      { headerName: "BlockId", field: "BlockId", sortable: true, filter: true },
      { headerName: "StainId", field: "StainId", sortable: true, filter: true },
      { headerName: "SlideNum", field: "SlideNum", sortable: true, filter: true },
      { headerName: "ImageId", field: "ImageId", sortable: true, filter: true },
      { headerName: "SlideId", field: "SlideId", sortable: true, filter: true },
      { headerName: "ScanDate", field: "ScanDate", sortable: true, filter: true },
      { headerName: "CompressedFileLocation", field: "CompressedFileLocation", sortable: true, filter: true, flex: 1 },
      {
        headerName: "TargetFilename",
        valueGetter: (params) => {
          const slide = params?.data?.__raw;
          const criteriaRow = params?.data?.__esm?.criteriaRow;
          const accessionToken = computeAccessionToken(slide, mappingConfig, criteriaRow);
          const base = buildBaseFilename(
            slide,
            accessionToken,
            mappingConfig,
            (value) => applyRules(value, selectedRules),
          );
          const p = slide?.CompressedFileLocation || "";
          const idx = p.lastIndexOf(".");
          const ext = idx !== -1 ? p.slice(idx) : "";
          return base ? `${base}${ext}` : "";
        },
        sortable: true,
        filter: true,
      },
    ];
  }, [mappingConfig, selectedRules]);

  useEffect(() => {
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
    autoSizeStrategy,
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
        theme={themeQuartz}
        rowSelection={"multiple"}
        onSelectionChanged={onSelectionChanged}
        suppressRowClickSelection={true}
        autoSizeStrategy={autoSizeStrategy}
        suppressMovableColumns={suppressMovableColumns}
        ensureDomOrder={ensureDomOrder}
        suppressDragLeaveHidesColumns={suppressDragLeaveHidesColumns}
        enableCellTextSelection={enableCellTextSelection}
        tooltipShowDelay={100}
      />
    </div>
  );
}
