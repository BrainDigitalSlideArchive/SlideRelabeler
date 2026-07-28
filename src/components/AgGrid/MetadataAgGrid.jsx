import React, { useState, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { diffWordsWithSpace } from 'diff';

import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

import './MetadataAgGrid.scss';

const FULLY_REPLACED_DIFF =
  'Fully replaced — see Current and Preview';

const LOW_SIMILARITY_THRESHOLD = 0.3;

export function getTextDiffHTML(oldText, newText) {
  const oldStr = oldText == null ? '' : String(oldText);
  const newStr = newText == null ? '' : String(newText);

  if (!oldStr && !newStr) {
    return '<span class="common"></span>';
  }
  if (!oldStr || !newStr) {
    return `<span>${FULLY_REPLACED_DIFF}</span>`;
  }

  const differences = diffWordsWithSpace(oldStr, newStr);
  const unchangedLen = differences.reduce(
    (sum, part) => (part.added || part.removed ? sum : sum + part.value.length),
    0,
  );
  const denom = Math.max(oldStr.length, newStr.length);
  const similarity = denom > 0 ? unchangedLen / denom : 0;

  if (similarity < LOW_SIMILARITY_THRESHOLD) {
    return `<span>${FULLY_REPLACED_DIFF}</span>`;
  }

  return `<span>${differences.map((part) => `<span class="${part.added ? 'ins' : part.removed ? 'del' : 'common'}">${part.value}</span>`).join('')}</span>`;
}

function ChangedCellRenderer({ data }) {
  if (data?.diff) {
    return <i style={{ color: 'green' }} className="fi fi-rr-check" />;
  }
  return null;
}

const MetadataAgGrid = (props) => {
  const { table } = props;
  const [display_visible, set_display_visible] = useState(false);
  const [display_data, set_display_data] = useState(null);

  const {
    suppressMovableColumns,
    ensureDomOrder,
    suppressDragLeaveHidesColumns,
    enableCellTextSelection,
    undoRedoCellEditing,
    undoRedoCellEditingLimit,
    display_changed_only,
  } = props;

  const handleDisplayData = useCallback((params) => {
    set_display_visible(true);
    const text_diff = getTextDiffHTML(params.data.prior, params.data.after);
    set_display_data({
      ...params.data,
      diff: text_diff,
    });
  }, []);

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'IFD',
        field: 'ifd',
        width: 80,
        onCellClicked: handleDisplayData,
      },
      {
        headerName: 'Tag',
        field: 'tag',
        width: 90,
        onCellClicked: handleDisplayData,
      },
      {
        headerName: 'Name',
        field: 'name',
        width: 160,
        onCellClicked: handleDisplayData,
        tooltipField: 'name',
        cellClass: 'metadata-ag-grid__clip-cell',
      },
      {
        headerName: 'Datatype',
        field: 'datatype',
        width: 100,
        onCellClicked: handleDisplayData,
      },
      {
        headerName: 'Current',
        field: 'prior',
        flex: 1,
        minWidth: 180,
        maxWidth: 420,
        onCellClicked: handleDisplayData,
        tooltipField: 'prior',
        cellClass: 'metadata-ag-grid__clip-cell',
      },
      {
        headerName: 'Preview',
        field: 'after',
        flex: 1,
        minWidth: 180,
        maxWidth: 420,
        onCellClicked: handleDisplayData,
        tooltipField: 'after',
        cellClass: 'metadata-ag-grid__clip-cell',
      },
      {
        headerName: 'Changed',
        field: 'diff',
        width: 90,
        onCellClicked: handleDisplayData,
        cellRenderer: ChangedCellRenderer,
      },
    ],
    [handleDisplayData],
  );

  const getRowStyle = useCallback((params) => {
    if (params.data?.diff) {
      return { backgroundColor: '#d8e0e3' };
    }
    return undefined;
  }, []);

  const rowData = useMemo(() => {
    if (!table) return [];
    if (display_changed_only) {
      return table.filter((row) => row.diff);
    }
    return table;
  }, [table, display_changed_only]);

  return (
    <div className="ag-theme-quartz __ag-grid metadata-ag-grid">
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        theme={themeQuartz}
        suppressMovableColumns={suppressMovableColumns}
        suppressScrollOnNewData
        ensureDomOrder={ensureDomOrder}
        suppressDragLeaveHidesColumns={suppressDragLeaveHidesColumns}
        enableCellTextSelection={enableCellTextSelection}
        undoRedoCellEditing={undoRedoCellEditing}
        undoRedoCellEditingLimit={undoRedoCellEditingLimit}
        tooltipShowDelay={100}
        getRowStyle={getRowStyle}
      />
      <div className={display_visible ? '__data _display' : '__data'}>
        <div className="__data-card">
          <div className="__data-card-header">
            <h3>IFD: {display_data ? display_data.ifd : ''}</h3>
            <h3>Tag: {display_data ? display_data.tag : ''}</h3>
            <h3>Name: {display_data ? display_data.name : ''}</h3>
            <button type="button" onClick={() => set_display_visible(!display_visible)}>
              {display_visible ? <i className="fi fi-rr-cross" /> : <i className="fa fa-eye" />}
            </button>
          </div>
          <div className="__data-card-content">
            <div className="__prior">
              <h4>Current</h4>
              <div className="__prior-data">
                {display_data ? display_data.prior : ''}
              </div>
            </div>
            <div className="__after">
              <h4>Preview</h4>
              <div className="__after-data">
                {display_data ? display_data.after : ''}
              </div>
            </div>
            <div className="__diff">
              <h4>Diff</h4>
              <div className="__diff-data">
                {display_data
                  ? React.createElement('div', {
                    dangerouslySetInnerHTML: { __html: display_data.diff },
                  })
                  : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetadataAgGrid;
