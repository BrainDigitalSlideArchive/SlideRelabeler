import {Map, List} from "immutable";
import React from "react";

export const default_state = {
    fileRows: [],
    totalBytes: 0,
    remainingBytes: 0,
    count: 0,
    errors: [],
    disable_changes: false,
    csv: {headers: null, rows: [], file_path: null, header_cols_link: {}},
    fileCols:
      [
        // pinned left column to clear individual rows
        {
          headerClass:'remove-row',
          width:5,
          resizable:false,
          sortable:false,
          pinned:'left',
          cellClass:'remove-row'
        },        // directory
        {
          field: 'source.directory',
          headerName: 'Directory',
          width:120,
          cellClass:'directory left-ellipsis',
          // valueFormatter: ({value})=>formatLeftEllipsis(value)
        },
        {
          field:'source.filename',
          headerName:'File name',
          cellClass:'filename'
        },
        {
          field: 'source.path',
          headerName:'Thumb',
        },
        {
          field: 'bytes',
          headerName:'Size',
          // valueFormatter:({value})=> displayBytes(value)
        },
        {
          field: 'associatedImages',
          headerName: 'Associated Images',
          // valueFormatter: v=>'fake',
          cellClass:'associated-images',
          // comparator:(valA, valB) => valA.length - valB.length/**/
        },        // Destination directory
        {
          field: 'destinationDirectory',
          headerName: 'Copy to',
          width:120,
          // cellClass: params=>params.data.processed === 0 ? 'directory left-ellipsis' : 'left-ellipsis',
          // colSpan: params => params.data.processed === 0 ? 1 : 2,
          // onCellClicked:({data})=>data.progress === 100 && electronAPI.openViewer(data.rename)
        },
        {
          field:'rename',
          headerName: 'Renamed as',
          // editable: params=>params.data.processed===0,
          // cellClass:({data})=>data.processed === 0 ? 'editable copy-as' : 'left-ellipsis copy-as copied-path',
          singleClickEdit:true,
          // onCellClicked:({value, data})=>data.processed && electronAPI.openViewer(value)
        },
        {
          field: 'processed',
          headerName: 'Progress',
          pinned: 'right',
          width: 150,
          resizable: false
        }
      ],
    processedFiles: {},
    output_dir: null,
    input_dir: null,
  processing: false,
};

export default default_state;