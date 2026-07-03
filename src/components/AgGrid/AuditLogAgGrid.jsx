import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';

import { AUDIT_STATUS } from '../../helpers/audit_log.js';
import {
  deriveBatchRows,
  filterEntriesByTypes,
  formatBatchId,
  AUDIT_VIEW_SLIDE_TYPES,
  AUDIT_VIEW_UPLOAD_TYPES,
} from '../../helpers/audit_log_views.js';

import './AppAgGrid.scss';
import './AuditLogAgGrid.scss';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

ModuleRegistry.registerModules([AllCommunityModule]);

function statusPillClass(status) {
  if (status === AUDIT_STATUS.SUCCESS) return 'audit-log-ag-grid__status-pill--success';
  if (status === AUDIT_STATUS.ERROR) return 'audit-log-ag-grid__status-pill--error';
  if (status === AUDIT_STATUS.PENDING) return 'audit-log-ag-grid__status-pill--pending';
  return '';
}

function StatusCellRenderer({ value }) {
  if (!value) return null;
  return (
    <span className={`audit-log-ag-grid__status-pill ${statusPillClass(value)}`}>
      {value}
    </span>
  );
}

function formatTimestampValue(value, fallback = '') {
  if (!value) return fallback;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return fallback || String(value);
  return d.toLocaleString();
}

function timestampValueGetter(params) {
  const ts = params.data?.timestamp ?? params.data?.displayTime;
  if (!ts) return null;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
}

function optionalTimestampValueGetter(field) {
  return (params) => {
    const ts = params.data?.[field];
    if (!ts) return null;
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? null : d;
  };
}

function formatCountValue(value) {
  if (value == null || value === '') return '—';
  return String(value);
}

const defaultColDef = {
  sortable: true,
  filter: true,
  floatingFilter: false,
  resizable: true,
  suppressHeaderMenuButton: false,
  suppressHeaderFilterButton: false,
  tooltipValueGetter: (params) => params.value ?? '',
};

const sequenceCol = {
  headerName: 'Sequence',
  colId: 'sequence',
  field: 'sequence',
  hide: true,
  sort: 'desc',
  sortIndex: 0,
  filter: false,
  sortable: true,
};

const selectionCol = {
  headerName: '',
  colId: '__select',
  field: '__select',
  width: 44,
  pinned: 'left',
  checkboxSelection: true,
  headerCheckboxSelection: true,
  headerCheckboxSelectionFilteredOnly: true,
  sortable: false,
  filter: false,
  resizable: false,
  suppressHeaderMenuButton: true,
};

function buildTimeColumn({ field = 'timestamp', headerName = 'Time', width = 185 } = {}) {
  const valueGetter = field === 'timestamp' || field === 'displayTime'
    ? timestampValueGetter
    : optionalTimestampValueGetter(field);

  return {
    headerName,
    colId: field,
    filter: 'agDateColumnFilter',
    width,
    valueGetter,
    valueFormatter: (params) => formatTimestampValue(
      params.value,
      params.data?.[field] ?? params.data?.displayTime ?? params.data?.timestamp ?? '',
    ),
    filterValueGetter: valueGetter,
    comparator: (valueA, valueB, nodeA, nodeB) => {
      const ta = valueA instanceof Date ? valueA.getTime() : new Date(valueA).getTime();
      const tb = valueB instanceof Date ? valueB.getTime() : new Date(valueB).getTime();
      if (ta === tb || (Number.isNaN(ta) && Number.isNaN(tb))) {
        return (nodeB.data?.sequence ?? 0) - (nodeA.data?.sequence ?? 0);
      }
      if (Number.isNaN(ta)) return 1;
      if (Number.isNaN(tb)) return -1;
      return ta - tb;
    },
  };
}

function AuditLogGridShell({
  rowData,
  columnDefs,
  gridRef,
  onDisplayChanged,
  onSelectionChanged,
}) {
  const mergedColumnDefs = useMemo(
    () => [selectionCol, ...columnDefs],
    [columnDefs],
  );

  return (
    <div className="ag-theme-quartz __ag-grid __audit-log-ag-grid">
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={mergedColumnDefs}
        defaultColDef={defaultColDef}
        theme={themeQuartz}
        rowSelection="multiple"
        suppressRowClickSelection
        suppressMovableColumns
        enableCellTextSelection
        tooltipShowDelay={400}
        rowHeight={32}
        headerHeight={36}
        onFilterChanged={onDisplayChanged}
        onSortChanged={onDisplayChanged}
        onGridReady={onDisplayChanged}
        onSelectionChanged={onSelectionChanged}
      />
    </div>
  );
}

export function AuditLogBatchAgGrid({ entries, gridRef, onDisplayChanged, onSelectionChanged }) {
  const rowData = useMemo(() => deriveBatchRows(entries), [entries]);

  const columnDefs = useMemo(() => [
    sequenceCol,
    buildTimeColumn({ field: 'displayTime', headerName: 'Time' }),
    {
      headerName: 'Batch ID',
      field: 'batchId',
      width: 100,
      cellClass: 'audit-log-ag-grid__type-cell',
      tooltipField: 'runId',
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 110,
      cellRenderer: StatusCellRenderer,
      filter: 'agTextColumnFilter',
    },
    {
      headerName: 'Total',
      field: 'totalCount',
      width: 80,
      valueFormatter: (params) => formatCountValue(params.value),
    },
    {
      headerName: 'Succeeded',
      field: 'successCount',
      width: 100,
      valueFormatter: (params) => formatCountValue(params.value),
    },
    {
      headerName: 'Failed',
      field: 'errorCount',
      width: 80,
      valueFormatter: (params) => formatCountValue(params.value),
    },
    buildTimeColumn({ field: 'startedAt', headerName: 'Started', width: 170 }),
    buildTimeColumn({ field: 'completedAt', headerName: 'Completed', width: 170 }),
  ], []);

  return (
    <AuditLogGridShell
      rowData={rowData}
      columnDefs={columnDefs}
      gridRef={gridRef}
      onDisplayChanged={onDisplayChanged}
      onSelectionChanged={onSelectionChanged}
    />
  );
}

function mapEntryRows(entries, types) {
  return filterEntriesByTypes(entries, types).map((entry) => ({
    ...entry,
    batchId: formatBatchId(entry.runId),
    sourcePath: entry.sourcePath ?? '',
    outputPath: entry.outputPath ?? '',
    outputName: entry.outputName ?? '',
    destination: entry.destination ?? '',
    errorMessage: entry.errorMessage ?? '',
    errorDetails: entry.errorDetails ?? '',
  }));
}

function slideErrorTooltipValueGetter(params) {
  const msg = params.data?.errorMessage ?? '';
  const details = params.data?.errorDetails ?? '';
  if (details) {
    return msg ? `${msg}\n\n${details}` : details;
  }
  return msg;
}

export function AuditLogSlideAgGrid({ entries, gridRef, onDisplayChanged, onSelectionChanged }) {
  const rowData = useMemo(
    () => mapEntryRows(entries, AUDIT_VIEW_SLIDE_TYPES),
    [entries],
  );

  const columnDefs = useMemo(() => [
    sequenceCol,
    buildTimeColumn(),
    {
      headerName: 'Batch ID',
      field: 'batchId',
      width: 100,
      cellClass: 'audit-log-ag-grid__type-cell',
      tooltipField: 'runId',
    },
    {
      headerName: 'Type',
      field: 'type',
      width: 140,
      cellClass: 'audit-log-ag-grid__type-cell',
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 110,
      cellRenderer: StatusCellRenderer,
      filter: 'agTextColumnFilter',
    },
    {
      headerName: 'Source path',
      field: 'sourcePath',
      flex: 1,
      minWidth: 160,
      cellClass: 'audit-log-ag-grid__path-cell',
      tooltipField: 'sourcePath',
      valueFormatter: (params) => params.value || '—',
    },
    {
      headerName: 'Output path',
      field: 'outputPath',
      flex: 1,
      minWidth: 160,
      cellClass: 'audit-log-ag-grid__path-cell',
      tooltipField: 'outputPath',
      valueFormatter: (params) => params.value || '—',
    },
    {
      headerName: 'Output name',
      field: 'outputName',
      flex: 1,
      minWidth: 140,
      tooltipField: 'outputName',
      valueFormatter: (params) => params.value || '—',
    },
    {
      headerName: 'Error',
      field: 'errorMessage',
      flex: 1,
      minWidth: 140,
      tooltipValueGetter: slideErrorTooltipValueGetter,
      valueFormatter: (params) => params.value || '—',
    },
  ], []);

  return (
    <AuditLogGridShell
      rowData={rowData}
      columnDefs={columnDefs}
      gridRef={gridRef}
      onDisplayChanged={onDisplayChanged}
      onSelectionChanged={onSelectionChanged}
    />
  );
}

export function AuditLogUploadAgGrid({ entries, gridRef, onDisplayChanged, onSelectionChanged }) {
  const rowData = useMemo(
    () => mapEntryRows(entries, AUDIT_VIEW_UPLOAD_TYPES),
    [entries],
  );

  const columnDefs = useMemo(() => [
    sequenceCol,
    buildTimeColumn(),
    {
      headerName: 'Batch ID',
      field: 'batchId',
      width: 100,
      cellClass: 'audit-log-ag-grid__type-cell',
      tooltipField: 'runId',
    },
    {
      headerName: 'Type',
      field: 'type',
      width: 140,
      cellClass: 'audit-log-ag-grid__type-cell',
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 110,
      cellRenderer: StatusCellRenderer,
      filter: 'agTextColumnFilter',
    },
    {
      headerName: 'Source path',
      field: 'sourcePath',
      flex: 1,
      minWidth: 160,
      cellClass: 'audit-log-ag-grid__path-cell',
      tooltipField: 'sourcePath',
      valueFormatter: (params) => params.value || '—',
    },
    {
      headerName: 'Output name',
      field: 'outputName',
      flex: 1,
      minWidth: 140,
      tooltipField: 'outputName',
      valueFormatter: (params) => params.value || '—',
    },
    {
      headerName: 'Destination',
      field: 'destination',
      flex: 1,
      minWidth: 140,
      tooltipField: 'destination',
      valueFormatter: (params) => params.value || '—',
    },
    {
      headerName: 'Error',
      field: 'errorMessage',
      flex: 1,
      minWidth: 140,
      tooltipField: 'errorMessage',
      valueFormatter: (params) => params.value || '—',
    },
  ], []);

  return (
    <AuditLogGridShell
      rowData={rowData}
      columnDefs={columnDefs}
      gridRef={gridRef}
      onDisplayChanged={onDisplayChanged}
      onSelectionChanged={onSelectionChanged}
    />
  );
}

export function getSelectedAuditRows(gridApi) {
  if (!gridApi) return [];
  return gridApi.getSelectedRows() ?? [];
}

export function getFilteredAuditEntries(gridApi) {
  if (!gridApi) return [];
  const rows = [];
  gridApi.forEachNodeAfterFilterAndSort((node) => {
    if (node.data) rows.push(node.data);
  });
  return rows;
}

export function getDisplayedAuditEntryCount(gridApi) {
  if (!gridApi) return 0;
  return gridApi.getDisplayedRowCount();
}
