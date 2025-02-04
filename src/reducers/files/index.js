import { createReducer}  from "@reduxjs/toolkit";
import { produce } from 'immer';

import default_state from './default_state';
import * as files_actions from '../../actions/files';

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
          const target_idx = state.fileRows.indexOf(action.payload);
          draft.fileRows.splice(target_idx, 1);
          draft.count -= 1;
          if (action.payload.bytes) {
            draft.totalBytes -= action.payload.bytes;
            draft.remainingBytes -= action.payload.bytes;
          }
        })
      })
      .addCase(files_actions.ADD_FILE_ROW, (state, action) => {
        return(produce(state, draft => {
          let file_row_already_added = false;
          // Check if file added
          for (let row_idx = 0; row_idx < state.fileRows.length; row_idx++) {
            if (state.fileRows[row_idx].source && state.fileRows[row_idx].source.path && state.fileRows[row_idx].source.path === action.payload.source.path) {
              draft.errors.push({message: "File already added", fileRow: action.payload});
              file_row_already_added = true;
            }
          }
          // Add file if not already added
          if (!file_row_already_added) {
            let fileRow = Object.assign({}, action.payload, {processed: 0}, {destinationDirectory: draft.output_dir});
            draft.fileRows.push(fileRow);
            draft.count += 1;
            if (fileRow.bytes) {
              draft.totalBytes += fileRow.bytes;
              draft.remainingBytes += fileRow.bytes;
            }
          }
        }))
      })
      .addCase(files_actions.UPDATE_FILE_ROW_WITH_METADATA, (state, action) => {
        console.log("Update row", action);
        return produce(state, draft => {
          draft.fileRows[action.payload.idx] = action.payload.row;
          if (action.payload.row.bytes) {
            draft.totalBytes += action.payload.row.bytes;
            draft.remainingBytes += action.payload.row.bytes;
          }
        })
      })
      .addCase(files_actions.UPDATE_FILE_ROW_WITHOUT_METADATA, (state, action) => {
        console.log("Update row", action);
        return produce(state, draft => {
          draft.fileRows[action.payload.idx] = action.payload.row;
        })
      })
      .addCase(files_actions.CLEAR_FILES, (state, action) => {
        return produce(state, draft => {
          draft.fileRows = [];
          draft.totalBytes = 0;
          draft.remainingBytes = 0;
          draft.count = 0;
        })
      })
      .addCase(files_actions.SET_OUTPUT_DIR, (state, action) => {
        return produce(state, draft => {
          draft.output_dir = action.payload;
          for (let row_idx = 0; row_idx < state.fileRows.length; row_idx++) {
            draft.fileRows[row_idx] = Object.assign({}, state.fileRows[row_idx], {destinationDirectory: action.payload});
          }
        })
      })
      .addCase(files_actions.UPDATE_ROW, (state, action) => {
        console.log("Update row :", action.payload);
        return produce(state, draft => {
          let field = action.payload.field;
          let row = Object.assign({}, state.fileRows[action.payload.idx], {value: action.payload.value, field: action.payload.field});
          draft.fileRows[action.payload.idx] = row;
          console.log("New row", draft.fileRows[action.payload.idx]);
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
      .addCase(files_actions.UPDATE_FILE_PROGRESS, (state, action) => {
        return produce(state, draft => {
          console.log("File row: ", action.payload.fileRow)
          console.log("API result: ", action.payload.api_result)
        })
      })
      .addCase(files_actions.PROCESSED_FILE, (state, action) => {
        for (let row_idx = 0; row_idx < state.fileRows.length; row_idx++) {
          if (state.fileRows[row_idx].source.path === action.payload.path) {
            return produce(state, draft => {
              draft.fileRows[row_idx].rename = action.payload.processedFile.output_path;
              draft.fileRows[row_idx].processed = 1;
              draft.fileRows[row_idx].progress = 1;
              draft.remainingBytes -= state.fileRows[row_idx].bytes;
            })
          }
        }
      })
      .addCase(files_actions.SELECT_IMPORT_CSV_XSLX, (state, action) => {
        return produce(state, draft => {
          draft.csv.data = [];
        })
      })
      .addCase(files_actions.SET_CSV_FILE_PATH, (state, action) => {
        return produce(state, draft => {
          draft.csv.file_path = action.payload.file_path;
        })
      })
      .addCase(files_actions.ADD_CSV_HEADERS, (state, action) => {
        return produce(state, draft => {
          draft.csv.header = action.payload.header;
          for (let row_idx = 0; row_idx < state.fileCols.length; row_idx++) {
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
      .addCase(files_actions.ADD_FILE_COL, (state, action) => {
        return produce(state, draft => {
          draft.fileCols.push({field: action.payload.field});
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
})

export default files_reducer;