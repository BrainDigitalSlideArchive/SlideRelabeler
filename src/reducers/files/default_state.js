import {Map, List} from "immutable";
import React from "react";

/** Ephemeral session counters (not persisted to disk). Reset on CLEAR_FILES. */
export const initialSessionMetrics = {
    copy_bytes: 0,
    copy_ms_closed: 0,
    copy_wall_start_ms: null,
    upload_bytes: 0,
    upload_ms_closed: 0,
    upload_wall_start_ms: null,
};

export const default_state = {
    file_rows: [],
    session_metrics: { ...initialSessionMetrics },
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
    upload_transfer_rates_bytes_per_ms: [],
    upload_transfer_rate_bytes_per_ms: null,
    upload_remaining_bytes: null,
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
        {
          headerClass: 'remove-row',
          pinned: 'left',
        },
        { field: '__reserved.source.directory' },
        { field: '__reserved.source.filename' },
        { field: '__reserved.bytes' },
        { field: '__reserved.associatedImages' },
        { field: '__reserved.destinationDirectory' },
        { field: '__reserved.rename' },
        { field: '__reserved.labelText' },
        { field: '__reserved.qrPayload' },
        { field: '__reserved.progress' },
      ],
    file_columns: [],
    processed_files: {},
    ifds: {},
    output_dir: null,
    input_dir: null,
    processing: false,
    uploading: false,
};

export default default_state;