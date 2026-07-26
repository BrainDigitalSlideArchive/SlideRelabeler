import { createReducer } from "@reduxjs/toolkit";
import { produce } from 'immer';

import default_state, { initialSessionMetrics } from './default_state';

import { isHiddenFileTableColumn } from '../../helpers/file_table_columns.js';
import { average } from '../../helpers/math';
import {
  normalizeSetOutputDirPayload,
} from '../../selectors/outputReadiness.js';
import {
  markDestinationSource,
  DESTINATION_SOURCE,
  resolveRowsAfterSetOutputDir,
} from '../../helpers/destination_directory.js';

import * as files_actions from '../../actions/files';
import * as app_actions from '../../actions/app';
import * as preview_actions from '../../actions/preview';
import * as dsa_actions from '../../actions/dsa';
import * as globus_actions from '../../actions/globus';

function ensureSessionMetrics(draft) {
  if (!draft.session_metrics) {
    draft.session_metrics = { ...initialSessionMetrics };
  }
}

function closeCopyWall(draft, now = Date.now()) {
  ensureSessionMetrics(draft);
  const m = draft.session_metrics;
  if (m.copy_wall_start_ms != null) {
    m.copy_ms_closed += now - m.copy_wall_start_ms;
    m.copy_wall_start_ms = null;
  }
}

function closeUploadWall(draft, now = Date.now()) {
  ensureSessionMetrics(draft);
  const m = draft.session_metrics;
  if (m.upload_wall_start_ms != null) {
    m.upload_ms_closed += now - m.upload_wall_start_ms;
    m.upload_wall_start_ms = null;
  }
}

function add_file_row(state, draft, input_file_row) {
  let file_row_already_added = false;
  // Check if file added already to avoid duplicates
  for (let row_idx = 0; row_idx < state.file_rows.length; row_idx++) {
    if (state.file_rows[row_idx].__reserved && state.file_rows[row_idx].__reserved.source && state.file_rows[row_idx].__reserved.source.path && state.file_rows[row_idx].__reserved.source.path === input_file_row.__reserved.source.path) {
      draft.errors.push({ message: "File already added", fileRow: input_file_row });
      file_row_already_added = true;
    }
  }
  // Add file if not already added
  if (!file_row_already_added) {
    let reserved = Object.assign({}, input_file_row.__reserved, { processed: 0 });
    let file_row = Object.assign(input_file_row, { '__reserved': reserved });

    if (!file_row.__reserved.destinationDirectory && state.output_dir) {
      file_row.__reserved.destinationDirectory = state.output_dir;
      file_row.__reserved = markDestinationSource(
        file_row.__reserved,
        DESTINATION_SOURCE.DEFAULT,
      );
    }

    draft.file_rows.push(file_row);
    draft.count += 1;
    if (file_row.__reserved.bytes) {
      draft.totalBytes += file_row.__reserved.bytes;
      draft.remainingBytes += file_row.__reserved.bytes;
    }
  }
}

const files_reducer = createReducer(default_state, (builder) => {
  builder
    .addCase(files_actions.UPDATE_FILES, (state, action) => {
      const p = action.payload;
      if (p && typeof p === 'object' && p.session_metrics == null) {
        return { ...p, session_metrics: { ...initialSessionMetrics } };
      }
      return p;
    })
    .addCase(files_actions.TOGGLE_PROCESSING, (state, action) => {
      return produce(state, draft => {
        const was = state.processing;
        draft.processing = !was;
        ensureSessionMetrics(draft);
        if (!was && draft.processing) {
          if (draft.session_metrics.copy_wall_start_ms == null) {
            draft.session_metrics.copy_wall_start_ms = Date.now();
          }
        }
        if (was && !draft.processing) {
          closeCopyWall(draft);
        }
      })
    })
    .addCase(files_actions.REMOVE_FILE, (state, action) => {
      return produce(state, draft => {
        let file_row = draft.file_rows[action.payload];
        draft.file_rows.splice(action.payload, 1);
        draft.count -= 1;
        if (file_row.__reserved.bytes) {
          draft.totalBytes -= file_row.__reserved.bytes;
          draft.remainingBytes -= file_row.__reserved.bytes;
        }
      })
    })
    .addCase(files_actions.ADD_FILE_ROW, (state, action) => {
      return (produce(state, draft => {
        add_file_row(state, draft, action.payload);
      }))
    })
    .addCase(files_actions.ADD_FILE_ROWS, (state, action) => {
      return produce(state, draft => {
        for (let row_idx = 0; row_idx < action.payload.length; row_idx++) {
          add_file_row(state, draft, action.payload[row_idx]);
        }
      })
    })
    .addCase(files_actions.RESET_FILE_ROW_PROGRESS, (state, action) => {
      return produce(state, draft => {
        if (draft.file_rows[action.payload]) {
          draft.file_rows[action.payload].__reserved.progress = 0;
          draft.file_rows[action.payload].__reserved.processed = 0;
        }
      })
    })
    .addCase(files_actions.SET_METADATA_UPDATING, (state, action) => {
      return produce(state, draft => {
        draft.metadata_updating = action.payload;
      })
    })
    .addCase(files_actions.UPDATE_FILE_ROW_WITH_METADATA, (state, action) => {
      return produce(state, draft => {
        let previous_file_row = draft.file_rows[action.payload.file_row_idx];
        draft.file_rows[action.payload.file_row_idx] = Object.assign({}, previous_file_row, action.payload.updated_file_row);
        if (action.payload.updated_file_row.__reserved.bytes) {
          draft.totalBytes += action.payload.updated_file_row.__reserved.bytes;
          draft.remainingBytes += action.payload.updated_file_row.__reserved.bytes;
        }
      })
    })
    .addCase(files_actions.UPDATE_FILE_ROW_WITH_ERROR, (state, action) => {
      return produce(state, draft => {
        const reserved = draft.file_rows[action.payload.file_row_idx].__reserved;
        reserved.error = action.payload.error;
        if (action.payload.errorDetails != null && String(action.payload.errorDetails).trim()) {
          reserved.errorDetails = action.payload.errorDetails;
        } else {
          delete reserved.errorDetails;
        }
      })
    })
    .addCase(files_actions.UPDATE_FILE_ROW_NAMING, (state, action) => {
      return produce(state, draft => {
        const { row_idx, file_row } = action.payload;
        if (!draft.file_rows[row_idx] || !file_row?.__reserved) return;
        const row = draft.file_rows[row_idx];
        const r = row.__reserved;
        const u = file_row.__reserved;
        const keys = ['labelText', 'qrPayload', 'dsaAlias', 'rename', 'dsa_enrich_error', 'dsa_item_id'];
        for (const k of keys) {
          if (u[k] !== undefined) {
            if (u[k] === '' || u[k] == null) {
              delete r[k];
            } else {
              r[k] = u[k];
            }
          }
        }
        if (file_row.AssembledName !== undefined) {
          row.AssembledName = file_row.AssembledName;
        }
      })
    })
    .addCase(files_actions.UPDATE_FILE_ROW_WITHOUT_METADATA, (state, action) => {
      return produce(state, draft => {
        draft.file_rows[action.payload.idx] = action.payload.row;
      })
    })
    .addCase(files_actions.ADD_PROCESSING_FILE, (state, action) => {
      return produce(state, draft => {
        draft.processing_files.push(action.payload);
      })
    })
    .addCase(files_actions.REMOVE_PROCESSING_FILE, (state, action) => {
      return produce(state, draft => {
        let processing_files = [];
        for (let idx in draft.processing_files) {
          if (draft.processing_files[idx].file_row_idx !== action.payload) {
            processing_files.push(draft.processing_files[idx]);
          }
        }
        draft.processing_files = processing_files;
      })
    })
    .addCase(files_actions.CLEAR_PROCESSING_FILES, (state, action) => {
      return produce(state, draft => {
        draft.processing_files = [];
      })
    })
    .addCase(files_actions.CLEAR_FILES, (state, action) => {
      return produce(state, draft => {
        draft.file_rows = [];
        draft.totalBytes = 0;
        draft.remainingBytes = 0;
        draft.count = 0;
        draft.output_dir = null;
        draft.processing = false;
        draft.csv = default_state.csv;
        draft.file_columns = [];
        draft.uploading = false;
        draft.upload_remaining_bytes = null;
        draft.upload_transfer_rate_bytes_per_ms = null;
        draft.upload_transfer_rates_bytes_per_ms = [];
        draft.session_metrics = { ...initialSessionMetrics };
      })
    })
    .addCase(files_actions.SET_OUTPUT_DIR, (state, action) => {
      return produce(state, draft => {
        const { folder, mode } = normalizeSetOutputDirPayload(action.payload);
        draft.output_dir = folder;
        draft.file_rows = resolveRowsAfterSetOutputDir(draft.file_rows, folder, mode);
      })
    })
    .addCase(files_actions.UPDATE_ROW, (state, action) => {
      console.log("Update row :", action.payload);
      return produce(state, draft => {
        let field = action.payload.field;
        let row = Object.assign({}, state.file_rows[action.payload.idx], { value: action.payload.value, field: action.payload.field });
        draft.file_rows[action.payload.idx] = row;
        console.log("New row", draft.file_rows[action.payload.idx]);
      })
    })
    .addCase(files_actions.SET_INPUT_DIR, (state, action) => {
      return produce(state, draft => {
        draft.input_dir = action.payload;
      })
    })
    .addCase(files_actions.ADD_TOTAL_BYTES, (state, action) => {
      return produce(state, draft => {
        draft.totalBytes += action.payload;
        draft.remaininBytes += action.payload;
      })
    })
    .addCase(files_actions.CLEAR_PROGRESS, (state, action) => {
      return produce(state, draft => {
        draft.progress_infos = [];
        draft.transfer_rate = null;
      })
    })
    .addCase(files_actions.UPDATE_FILE_PROGRESS, (state, action) => {
      return produce(state, draft => {
        let row_idx = action.payload.row_idx;
        if (action.payload.progress_info) {
          draft.file_rows[row_idx].__reserved.progress = action.payload.progress_info.progress;

          draft.progress_infos.push(action.payload.progress_info);

          if (draft.progress_infos.length > 10) {
            draft.progress_infos.shift();
          }

          let transfer_rates = [];

          if (draft.progress_infos.length > 1) {
            for (let i = 0; i < draft.progress_infos.length - 1; i++) {
              if (i < draft.progress_infos.length - 1) {
                let time_n = draft.progress_infos[i].time;
                let time_n_plus_1 = draft.progress_infos[i + 1].time;
                let time_diff_seconds = (time_n_plus_1 - time_n) / 1000;
                let bytes_diff = draft.progress_infos[i + 1].bytes - draft.progress_infos[i].bytes;

                if (time_diff_seconds > 0 && bytes_diff > 0) {
                  transfer_rates.push(bytes_diff / time_diff_seconds);
                }
              }
            }
          }

          if (transfer_rates.length > 1) {
            draft.transfer_rate = average(transfer_rates);
          }
        }
      })
    })
    .addCase(files_actions.GLOBUS_UPLOAD_FILE_METRICS, (state, action) => {
      return produce(state, draft => {
        const row_idx = action.payload.row_idx;
        if (!draft.file_rows[row_idx]) return;
        draft.file_rows[row_idx].__reserved.globus_upload_duration_sec = action.payload.duration_sec;
        draft.file_rows[row_idx].__reserved.upload_progress_indeterminate = false;
        draft.file_rows[row_idx].__reserved.upload_progress = 100;
        const bps = action.payload.effective_bytes_per_second;
        if (typeof bps === 'number' && bps > 0) {
          draft.upload_transfer_rate_bytes_per_ms = bps / 1000;
        }
      });
    })
    .addCase(files_actions.UPDATE_FILE_UPLOAD_PROGRESS, (state, action) => {
      return produce(state, draft => {
        const row_idx = action.payload.row_idx;
        const indeterminate = !!action.payload.indeterminate;
        const isGlobus = !!action.payload.globus;
        const numProgress =
          typeof action.payload.progress === 'number' && !Number.isNaN(action.payload.progress)
            ? action.payload.progress
            : 0;

        draft.file_rows[row_idx].__reserved.upload_progress_indeterminate = indeterminate;
        draft.file_rows[row_idx].__reserved.upload_progress = numProgress;

        let reamining_upload_bytes = 0;

        const rowBytes = draft.file_rows[row_idx].__reserved.bytes;
        const currentRowFactor =
          isGlobus && indeterminate ? 1 : indeterminate ? 0.5 : (100 - numProgress) / 100;
        reamining_upload_bytes += rowBytes * currentRowFactor;

        for (let i = 0; i < draft.file_rows.length; i++) {
          if (i !== row_idx && (draft.file_rows[i].__reserved.upload_progress === undefined || draft.file_rows[i].__reserved.upload_progress === 0)) {
            reamining_upload_bytes += draft.file_rows[i].__reserved.bytes;
          }
        }
        draft.upload_remaining_bytes = reamining_upload_bytes;

        if (action.payload.rate_bytes_per_ms !== undefined) {
          draft.upload_transfer_rate_bytes_per_ms = action.payload.rate_bytes_per_ms;
        }
      })
    })
    .addCase(files_actions.UPLOAD_DELETE_AFTER, (state, action) => {
      return produce(state, draft => {
        draft.file_rows[action.payload.row_idx].__reserved.deleted_after = true;
      })
    })
    .addCase(files_actions.PROCESSED_FILE, (state, action) => {
      return produce(state, draft => {
        let row_idx = action.payload.row_idx;
        draft.file_rows[row_idx].__reserved.output_path = action.payload.processedFile.output_path;
        draft.file_rows[row_idx].__reserved.processed = 1;
        draft.file_rows[row_idx].__reserved.progress = 100;
        draft.file_rows[row_idx].__reserved.associatedImages = action.payload.processedFile.associatedImages;
        draft.remainingBytes -= state.file_rows[row_idx].__reserved.bytes;
        ensureSessionMetrics(draft);
        const b = draft.file_rows[row_idx].__reserved.bytes;
        if (typeof b === 'number' && b > 0) {
          draft.session_metrics.copy_bytes += b;
        }
      })
    })
    .addCase(files_actions.UPLOAD_FILE_FINALIZE, (state, action) => {
      return produce(state, draft => {
        const ri = action.payload.row_idx;
        draft.file_rows[ri].__reserved.upload_progress = 100;
        draft.file_rows[ri].__reserved.upload_progress_indeterminate = false;
        ensureSessionMetrics(draft);
        const b = draft.file_rows[ri].__reserved.bytes;
        if (typeof b === 'number' && b > 0) {
          draft.session_metrics.upload_bytes += b;
        }
      })
    })
    .addCase(dsa_actions.UPLOAD_FILE, (state, action) => {
      return produce(state, draft => {
        draft.file_rows[action.payload.row_idx].__reserved.upload_progress = 0;
        draft.file_rows[action.payload.row_idx].__reserved.upload_progress_indeterminate = false;
      })
    })
    .addCase(globus_actions.UPLOAD_FILE, (state, action) => {
      return produce(state, draft => {
        const ri = action.payload.row_idx;
        draft.file_rows[ri].__reserved.upload_progress = 0;
        draft.file_rows[ri].__reserved.upload_progress_indeterminate = true;
        delete draft.file_rows[ri].__reserved.globus_upload_duration_sec;
      })
    })
    .addCase(globus_actions.UPLOAD_FILE_FAILURE, (state, action) => {
      return produce(state, draft => {
        const p = action.payload || {};
        const ri = p.row_idx;
        if (ri == null || !draft.file_rows[ri]) return;
        draft.file_rows[ri].__reserved.upload_progress = 0;
        draft.file_rows[ri].__reserved.upload_progress_indeterminate = false;
        delete draft.file_rows[ri].__reserved.globus_upload_duration_sec;
        if (p.message != null && String(p.message).trim()) {
          draft.file_rows[ri].__reserved.error = String(p.message);
        }
      })
    })
    .addCase(files_actions.UPLOAD_FILE_ERROR, (state, action) => {
      return produce(state, draft => {
        const p = action.payload || {};
        const ri = p.row_idx;
        if (ri == null || !draft.file_rows[ri]) return;
        const msg = p.error != null ? String(p.error) : p.message != null ? String(p.message) : 'Upload failed';
        draft.file_rows[ri].__reserved.error = msg;
        draft.file_rows[ri].__reserved.upload_progress = 0;
        draft.file_rows[ri].__reserved.upload_progress_indeterminate = false;
        delete draft.file_rows[ri].__reserved.globus_upload_duration_sec;
      })
    })
    .addCase(files_actions.SELECT_IMPORT_CSV_XSLX, (state, action) => {
      return produce(state, draft => {
        draft.csv.data = [];
      })
    })
    .addCase(files_actions.SET_CSV_FILE_PATH, (state, action) => {
      return produce(state, draft => {
        draft.csv.csv_file_path = action.payload;
      })
    })
    .addCase(files_actions.ADD_CSV_HEADERS, (state, action) => {
      return produce(state, draft => {
        draft.csv.header = action.payload.headers ?? action.payload.header ?? [];
      });
    })
    .addCase(files_actions.ADD_CSV_ROWS, (state, action) => {
      return produce(state, draft => {
        draft.csv.rows.push(action.payload.row);
      });
    })
    .addCase(files_actions.LINK_CSV_HEADER, (state, action) => {
      return produce(state, draft => {
        draft.csv.header_cols_link[action.payload.header] = { field: action.payload.field, header_idx: action.payload.header_idx };
      });
    })
    .addCase(files_actions.SET_CSV_NEEDS_OUTPUT_DIR, (state, action) => {
      return produce(state, draft => {
        draft.csv.needs_output_dir = action.payload;
      })
    })
    .addCase(files_actions.ADD_FILE_COL, (state, action) => {
      return produce(state, draft => {
        const field = action.payload?.field;
        if (isHiddenFileTableColumn(field)) return;
        let filtered_cols = draft.file_columns.filter(col => col.field === field);
        if (filtered_cols.length === 0) {
          draft.file_columns.push({ field, flex: 1, minWidth: 100 });
        }
      });
    })
    .addCase(files_actions.DISABLE_CHANGES, (state, action) => {
      return produce(state, draft => {
        draft.disable_changes = true;
      })
    })
    .addCase(files_actions.ENABLE_CHANGES, (state, action) => {
      return produce(state, draft => {
        draft.disable_changes = false;
      })
    })
    .addCase(files_actions.LINK_HEADER_TO_PATH_COLUMN, (state, action) => {
      return produce(state, draft => {
        draft.csv.reserved_path_column = { header: action.payload.header, header_idx: action.payload.header_idx };
      });
    })
    .addCase(files_actions.LINK_HEADER_TO_RENAME_COLUMN, (state, action) => {
      return produce(state, draft => {
        draft.csv.reserved_rename_column = { header: action.payload.header, header_idx: action.payload.header_idx };
      });
    })
    .addCase(files_actions.LINK_HEADER_TO_DESTINATION_DIRECTORY_COLUMN, (state, action) => {
      return produce(state, draft => {
        draft.csv.reserved_destination_directory_column = { header: action.payload.header, header_idx: action.payload.header_idx };
      });
    })
    .addCase(files_actions.LINK_HEADER_TO_LABEL_COLUMN, (state, action) => {
      return produce(state, draft => {
        draft.csv.reserved_label_column = { header: action.payload.header, header_idx: action.payload.header_idx };
      });
    })
    .addCase(files_actions.LINK_HEADER_TO_QR_COLUMN, (state, action) => {
      return produce(state, draft => {
        draft.csv.reserved_qr_column = { header: action.payload.header, header_idx: action.payload.header_idx };
      });
    })
    .addCase(app_actions.RESET_STORE, (state, action) => {
      return default_state;
    })
    .addCase(files_actions.NOT_PROCESSING, (state, action) => {
      return produce(state, draft => {
        if (state.processing) {
          closeCopyWall(draft);
        }
        draft.processing = false;
      })
    })
    .addCase(files_actions.SET_CSV_FILE, (state, action) => {
      return produce(state, draft => {
        draft.csv.file = action.payload;
      })
    })
    .addCase(preview_actions.SET_METADATA_PREVIEW, (state, action) => {
      return produce(state, draft => {
        draft.ifds[action.payload.path] = action.payload.table;
      })
    })
    .addCase(files_actions.SET_UPLOADING, (state, action) => {
      return produce(state, draft => {
        const next = action.payload;
        const was = state.uploading;
        ensureSessionMetrics(draft);
        if (!was && next) {
          if (draft.session_metrics.upload_wall_start_ms == null) {
            draft.session_metrics.upload_wall_start_ms = Date.now();
          }
        }
        if (was && !next) {
          closeUploadWall(draft);
        }
        draft.uploading = next;
      })
    })
}
);

export default files_reducer;