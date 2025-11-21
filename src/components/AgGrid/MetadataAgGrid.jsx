import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useDispatch, useSelector } from "react-redux";
import Diff from 'text-diff';

import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

// import "ag-grid-community/styles/ag-grid.css"; // Core CSS
// import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme

import './MetadataAgGrid.scss';


const MetadataAgGrid = (props) => {
    const { table } = props;
    const [display_visible, set_display_visible] = useState(false);
    const [display_data, set_display_data] = useState(null);

    const {
        autoSizeStrategy,
        suppressMovableColumns,
        ensureDomOrder,
        suppressDragLeaveHidesColumns,
        enableCellTextSelection,
        undoRedoCellEditing,
        undoRedoCellEditingLimit,
        display_changed_only
    } = props;

    function onCellClicked(params) {
        handle_display_data(params);
    }

    let column_defs = [
        {
            headerName: 'IFD',
            field: 'ifd',
            width: 100,
            onCellClicked: onCellClicked
        },
        {
            headerName: 'Tag',
            field: 'tag',
            width: 100,
            onCellClicked: onCellClicked
        },
        {
            headerName: 'Name',
            field: 'name',
            width: 100,
            onCellClicked: onCellClicked
        },
        {
            headerName: 'Datatype',
            field: 'datatype',
            width: 100,
            onCellClicked: onCellClicked
        },
        {
            headerName: 'Prior',
            field: 'prior',
            width: 100,
            onCellClicked: onCellClicked,
            cellRenderer: (params) => {
                return React.createElement('div', { dangerouslySetInnerHTML: { __html: params.value } });
            }
        },
        {
            headerName: 'After',
            field: 'after',
            width: 100,
            onCellClicked: onCellClicked
        },
        {
            headerName: "Changed",
            field: 'diff',
            width: 100,
            onCellClicked: onCellClicked,
            cellRenderer: ({ data }) => {
                if (data.diff) {
                    return <i style={{ color: 'green' }} className="fi fi-rr-check"></i>;
                } else {
                    return null;
                }
            }
        }
    ];

    function handle_display_data(params) {
        set_display_visible(true);
        let diff = new Diff();
        let text_diff = diff.main(String(params.data.prior), String(params.data.after));
        let data = {
            ...params.data,
        }

        data.diff = diff.prettyHtml(text_diff);
        console.log(data);
        set_display_data(data);
    }

    function getRowStyle(params) {
        if (params.data.diff) {
            return {
                backgroundColor: '#d8e0e3',
            }
        }
    }

    function display_changed_only_table(table) {
        if (display_changed_only) {
            return table.filter(row => row.diff);
        } else {
            return table;
        }
    }

    return (
        <div className={"ag-theme-quartz __ag-grid"}>
            <AgGridReact
                rowData={display_changed_only_table(table)}
                columnDefs={column_defs}
                rowStyle={{
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                }}
                theme={themeQuartz}
                autoSizeStrategy={autoSizeStrategy}
                suppressMovableColumns={suppressMovableColumns}
                suppressScrollOnNewData={true}
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
                        <button onClick={() => set_display_visible(!display_visible)}>
                            {display_visible ? <i className="fi fi-rr-cross"></i> : <i className="fa fa-eye"></i>}
                        </button>
                    </div>
                    <div className="__data-card-content">
                        <div className="__prior">
                            <h4>Prior</h4>
                            <div className="__prior-data">
                                {display_data ? React.createElement('div', { dangerouslySetInnerHTML: { __html: display_data.prior } }) : ''}
                            </div>
                        </div>
                        <div className="__after">
                            <h4>After</h4>
                            <div className="__after-data">
                                {display_data ? display_data.after : ''}
                            </div>
                        </div>
                        <div className="__diff">
                            <h4>Diff</h4>
                            <div className="__diff-data">
                                {display_data ? React.createElement('div', { dangerouslySetInnerHTML: { __html: display_data.diff } }) : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MetadataAgGrid;