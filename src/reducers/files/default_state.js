import {Map, List} from "immutable";
import React from "react";

export const default_state = {
    file_rows: [],
    totalBytes: 0,
    remainingBytes: 0,
    count: 0,
    errors: [],
    disable_changes: false,
    metadata_updating: false,
    csv: {file: null,headers: null, rows: [], output_dir: null, needs_output_dir: false, needs_csv_output_dir: false, csv_file_path: null, reserved_path_column: null, reserved_rename_column: null, reserved_destination_directory_column: null},
    processing_files: [],
    progress_infos: [],
    transfer_rate: null, // in bytes per second
    reserved_column_names: [
      '__reserved.source',
      '__reserved.source.directory',
      '__reserved.source.filename',
      '__reserved.source.path',
      '__reserved.bytes',
      '__reserved.associatedImages',
      '__reserved.destinationDirectory',
      '__reserved.rename',
      '__reserved.progress',
    ],
    blocked_fields: [
      {'field': '__reserved.processed'},
      {'field': '__reserved.progress'}
    ],
    reserved_columns:
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
          field: '__reserved.source.directory',
          headerName: 'Directory',
          minWidth: 120,
          cellClass: 'cell-container __cell',
          // valueFormatter: ({value})=>formatLeftEllipsis(value)
        },
        {
          field:'__reserved.source.filename',
          headerName:'File name',
          cellClass:'cell-container __cell',
        },
        {
          field: '__reserved.source.path',
          headerName:'Thumb',
          cellClass: 'cell-container __cell',
        },
        {
          field: '__reserved.bytes',
          headerName:'Size',
          cellClass: 'cell-container __cell',
          // valueFormatter:({value})=> displayBytes(value)
        },
        {
          field: '__reserved.associatedImages',
          headerName: 'Associated Images',
          // valueFormatter: v=>'fake',
          cellClass:'associated-images',
          // comparator:(valA, valB) => valA.length - valB.length/**/
        },        // Destination directory
        {
          field: '__reserved.destinationDirectory',
          headerName: 'Copy to',
          cellClass: 'cell-container __cell',
          // width: 120,
          // cellClass: params=>params.data.processed === 0 ? 'directory left-ellipsis' : 'left-ellipsis',
          // colSpan: params => params.data.processed === 0 ? 1 : 2,
          // onCellClicked:({data})=>data.progress === 100 && electronAPI.openViewer(data.rename)
        },
        {
          field: '__reserved.rename',
          headerName: 'Renamed as',
          // editable: params=>params.data.reserved.processed===0,
          // cellClass:({data})=>data.reserved.processed === 0 ? 'editable copy-as' : 'left-ellipsis copy-as copied-path',
          singleClickEdit: true,
          // onCellClicked:({value, data})=>data.reserved.processed && electronAPI.openViewer(value)
        },
        {
          field: '__reserved.progress',
          headerName: 'Progress',
          cellClass: 'cell-container __full-cell',
          pinned: 'right',
          width: 150,
          resizable: false
        }
      ],
    file_columns: [],
    processed_files: {},
    ifds: {},
    output_dir: null,
    input_dir: null,
  processing: false,
};

export default default_state;