import React, { useMemo, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { useDispatch, useSelector } from "react-redux";

// Setup the community module (consistent with AppAgGrid)
import { ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

import {
  computeAccessionToken,
  buildBaseFilename,
  applyDuplicateStrategy,
  getAccessionFromBarcodeId,
} from "../../helpers/esm_filename_helpers";

import { applyRules, getSelectedTransformRules } from "../../helpers/esm_transform_rules";

import "./ESMAgGrid.scss";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import * as esm_actions from "../../actions/esm";

function normalizeSlidesToRows(slides) {
  if (!Array.isArray(slides)) return [];
  return slides.map((s) => {
    const accession = getAccessionFromBarcodeId(s?.BarcodeId);
    const id = (s?.ImageId ?? s?.SlideId ?? `${accession}:${s?.SlideNum ?? ""}:${s?.CompressedFileLocation ?? ""}`).toString();
    return {
      __esm: {
        id,
      },
      Accession: accession,
      BlockId: s?.BlockId || "",
      StainId: s?.StainId || "",
      SlideNum: s?.SlideNum || "",
      ImageId: s?.ImageId || "",
      SlideId: s?.SlideId || "",
      ScanDate: s?.ScanDate || "",
      BarcodeId: s?.BarcodeId || "",
      CompressedFileLocation: s?.CompressedFileLocation || "",
      __raw: s,
    };
  });
}

export default function ESMAgGrid(props) {
  const dispatch = useDispatch();
  const gridRef = useRef(null);

  const slides = useSelector((state) => state.esm.results);
  const selectedIds = useSelector((state) => state.esm.selectedIds);
  const mappingConfig = useSelector((state) => state.esm.mappingConfig);
  const transformRules = useSelector((state) => state.esm.transformRules) || [];
  const selectedTransformRuleIds = useSelector((state) => state.esm.selectedTransformRuleIds) || [];

  const selectedRules = useMemo(
    () => getSelectedTransformRules(transformRules, selectedTransformRuleIds),
    [transformRules, selectedTransformRuleIds],
  );

  const rows = useMemo(() => normalizeSlidesToRows(slides), [slides]);

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
          const accessionToken = computeAccessionToken(slide, mappingConfig);
          const base = buildBaseFilename(
            slide,
            accessionToken,
            mappingConfig,
            (value) => applyRules(value, selectedRules),
          );
          const ext = (() => {
            const p = slide?.CompressedFileLocation || "";
            const idx = p.lastIndexOf(".");
            return idx !== -1 ? p.slice(idx) : "";
          })();
          return base ? `${base}${ext}` : "";
        },
        sortable: true,
        filter: true,
      },
    ];
  }, [mappingConfig, selectedRules]);

  // Keep grid selection in sync with esm.selectedIds (e.g. when new results arrive)
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

