import { createReducer}  from "@reduxjs/toolkit";
import { produce } from 'immer';

import default_state from './default_state';

import { average } from '../../helpers/math';

import * as files_actions from '../../actions/files';
import * as app_actions from '../../actions/app';
import * as preview_actions from '../../actions/preview';

function add_file_row(state, draft, input_file_row) {
  let file_row_already_added = false;
  // Check if file added already to avoid duplicates
  for (let row_idx = 0; row_idx < state.file_rows.length; row_idx++) {
    if (state.file_rows[row_idx].__reserved && state.file_rows[row_idx].__reserved.source && state.file_rows[row_idx].__reserved.source.path && state.file_rows[row_idx].__reserved.source.path === input_file_row.__reserved.source.path) {
      draft.errors.push({message: "File already added", fileRow: input_file_row});
      file_row_already_added = true;
    }
  }
  // Add file if not already added
  if (!file_row_already_added) {
    let reserved = Object.assign({}, input_file_row.__reserved, {processed: 0});
    let file_row = Object.assign(input_file_row, {'__reserved': reserved});

    if (!file_row.__reserved.destinationDirectory) {
      if (state.output_dir) {
        file_row.__reserved.destinationDirectory = state.output_dir;
      } else if (state.csv.output_dir) {
        file_row.__reserved.destinationDirectory = state.csv.output_dir;
      }
    }
    
    draft.file_rows.push(file_row);
    draft.count += 1;
    if (file_row.__reserved.bytes) {
      draft.totalBytes += file_row.__reserved.bytes;
      draft.remainingBytes += file_row.__reserved.bytes;
    }
  }
}

const files_reducer  = createReducer(default_state, (builder) => {
    builder
      .addCase(files_actions.UPDATE_FILES, (state, action) => {
        return action.payload
      })
      .addCase(files_actions.TOGGLE_PROCESSING, (state, action) => {
        return produce(state, draft => {
          draft.processing = !state.processing;
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
        return(produce(state, draft => {
          add_file_row(state, draft, action);
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
          draft.file_rows[action.payload.file_row_idx].__reserved.error = action.payload.error;
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
        })
      })
      .addCase(files_actions.SET_OUTPUT_DIR, (state, action) => {
        return produce(state, draft => {
          draft.output_dir = action.payload;

          for (let row_idx = 0; row_idx < draft.file_rows.length; row_idx++) {
            draft.file_rows[row_idx].__reserved.destinationDirectory = action.payload;
          }
        })
      })
      .addCase(files_actions.SET_CSV_OUTPUT_DIR, (state, action) => {
        return produce(state, draft => {
          draft.csv.output_dir = action.payload;
        })
      })
      .addCase(files_actions.UPDATE_ROW, (state, action) => {
        console.log("Update row :", action.payload);
        return produce(state, draft => {
          let field = action.payload.field;
          let row = Object.assign({}, state.file_rows[action.payload.idx], {value: action.payload.value, field: action.payload.field});
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
                  let time_n =draft.progress_infos[i].time;
                  let time_n_plus_1 = draft.progress_infos[i + 1].time;
                  let time_diff_seconds = (time_n_plus_1 - time_n) / 1000;
                  let bytes_diff = draft.progress_infos[i+1].bytes - draft.progress_infos[i].bytes;

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
      .addCase(files_actions.PROCESSED_FILE, (state, action) => {
        return produce(state, draft => {
          let row_idx = action.payload.row_idx;
          draft.file_rows[row_idx].__reserved.output_path = action.payload.processedFile.output_path;
          draft.file_rows[row_idx].__reserved.processed = 1;
          draft.file_rows[row_idx].__reserved.progress = 100;
          draft.remainingBytes -= state.file_rows[row_idx].__reserved.bytes;
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
          draft.csv.header = action.payload.header;
          for (let row_idx = 0; row_idx < state.file_columns.length; row_idx++) {
          }
        });
      })
      .addCase(files_actions.ADD_CSV_ROWS, (state, action) => {
        return produce(state, draft => {
          draft.csv.rows.push(action.payload.row);
        });
      })
      .addCase(files_actions.LINK_CSV_HEADER, (state, action) => {
        return produce(state, draft => {
          draft.csv.header_cols_link[action.payload.header] = {field: action.payload.field, header_idx: action.payload.header_idx};
        });
      })
      .addCase(files_actions.SET_CSV_NEEDS_CSV_OUTPUT_DIR, (state, action) => {
        return produce(state, draft => {
          draft.csv.needs_csv_output_dir = action.payload;
        })
      })
      .addCase(files_actions.SET_CSV_NEEDS_OUTPUT_DIR, (state, action) => {
        return produce(state, draft => {
          draft.csv.needs_output_dir = action.payload;
        })
      })
      .addCase(files_actions.ADD_FILE_COL, (state, action) => {
        return produce(state, draft => {
          let filtered_cols = draft.file_columns.filter(col => col.field === action.payload.field);
          if (filtered_cols.length === 0) {
            draft.file_columns.push({field: action.payload.field});
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
          draft.csv.reserved_path_column = {header: action.payload.header, header_idx: action.payload.header_idx};
        });
      })
      .addCase(files_actions.LINK_HEADER_TO_RENAME_COLUMN, (state, action) => {
        return produce(state, draft => {
          draft.csv.reserved_rename_column = {header: action.payload.header, header_idx: action.payload.header_idx};
        });
      })
      .addCase(files_actions.LINK_HEADER_TO_DESTINATION_DIRECTORY_COLUMN, (state, action) => {
        return produce(state, draft => {
          draft.csv.reserved_destination_directory_column = {header: action.payload.header, header_idx: action.payload.header_idx};
        });
      })
      .addCase(app_actions.RESET_STORE, (state, action) => {
        return default_state;
      })
      .addCase(files_actions.NOT_PROCESSING, (state, action) => {
        return produce(state, draft => {
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
          if (!draft.ifds[action.payload.path]) {
            draft.ifds[action.payload.path] = action.payload.table;
          }
        })
      })
    }
  );

export default files_reducer;