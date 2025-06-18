import { createReducer}  from "@reduxjs/toolkit";
import {produce} from 'immer';
import default_state from './default_state';

import * as config_actions from '../../actions/config';
import * as app_actions from '../../actions/app';
import * as files_actions from '../../actions/files';

const config_reducer  = createReducer(default_state, (builder) => {
  builder
    .addCase(config_actions.UPDATE_CONFIG, (state, action) => {
      return action.payload;
    })
    .addCase(config_actions.CHANGE_PREFIX, (state, action) => {
      return produce(state, draft => {
        draft.filename.prefix = action.payload;
      })
    })
    .addCase(config_actions.CHANGE_SUFFIX, (state, action) => {
      return produce(state, draft => {
        draft.filename.suffix = action.payload;
      })
    })
    .addCase(config_actions.CHANGE_FILE_PATH_COLUMN, (state, action) => {
      return produce(state, draft => {
        draft.csv.file_path_column = action.payload;
      })
    })
    .addCase(config_actions.CHANGE_FILE_RENAME_COLUMN, (state, action) => {
      return produce(state, draft => {
        draft.csv.file_rename_column = action.payload;
      })
    })
    .addCase(config_actions.CHANGE_FILE_DESTINATION_DIRECTORY_COLUMN, (state, action) => {
      return produce(state, draft => {
        draft.csv.file_destination_directory_column = action.payload;
      })
    })
    .addCase(config_actions.TOGGLE_UUID, (state, action) => {
      return produce(state, draft => {
        draft.filename.use_uuid = !state.filename.use_uuid;
      })
    })
    .addCase(config_actions.TOGGLE_PREFIX, (state, action) => {
      return produce(state, draft => {
        draft.filename.use_prefix = !state.filename.use_prefix;
      })
    })
    .addCase(config_actions.TOGGLE_SUFFIX, (state, action) => {
      return produce(state, draft => {
        draft.filename.use_suffix = !state.filename.use_suffix;
      })
    })
    .addCase(config_actions.TOGGLE_NON_RANDOM, (state, action) => {
      return produce(state, draft => {
        draft.filename.use_uuid = !state.filename.use_uuid;
      })
    })
    .addCase(config_actions.TOGGLE_SAVE_CSV, (state, action) => {
      return produce(state, draft => {
        draft.csv.save_csv = !state.csv.save_csv;
      })
    })
    .addCase(config_actions.CHANGE_QR_MODE, (state, action) => {
      return produce(state, draft => {
        draft.label.qr_mode = action.payload;
      })
    })
    .addCase(config_actions.TOGGLE_ADD_ICON, (state, action) => {
      return produce(state, draft => {
        draft.label.add_icon = !state.label.add_icon;
      })
    })
    .addCase(config_actions.CHANGE_ICON_FILE, (state, action) => {
      return produce(state, draft => {
        draft.label.icon_file = action.payload;
      })
    })
    .addCase(config_actions.TOGGLE_SAVE_MACRO, (state, action) => {
      return produce(state, draft => {
        draft.wsi.save_macro_image = !state.wsi.save_macro_image;
      })
    })
    .addCase(config_actions.TOGGLE_ADD_LABEL_QR, (state, action) => {
      return produce(state, draft => {
        draft.label.add_qr = !state.label.add_qr;
      })
    })
    .addCase(config_actions.TOGGLE_ADD_LABEL_TEXT, (state, action) => {
      return produce(state, draft => {
        draft.label.add_text = !state.label.add_text;
      })
    })
    .addCase(config_actions.CHANGE_QR_COLUMN_FIELD, (state, action) => {
      return produce(state, draft => {
        draft.label.qr_column_field = action.payload
      })
    })
    .addCase(config_actions.CHANGE_TEXT_COLUMN_FIELD, (state, action) => {
      return produce(state, draft => {
        draft.label.text_column_field = action.payload
      })
    })
    .addCase(config_actions.CHANGE_QR_COLUMN_FIELDS, (state, action) => {
      return produce(state, draft => {
        let filtered = state.label.qr_column_fields.filter(column_field => column_field.value !== action.payload.value);
        if (filtered.length !== state.label.qr_column_fields.length) {
          draft.label.qr_column_fields = filtered;
        } else {
          draft.label.qr_column_fields = [...state.label.qr_column_fields, action.payload]
        }
      })
    })
    .addCase(config_actions.TOGGLE_ENABLE_DEBUG, (state, action) => {
      return produce(state, draft => {
        draft.debug.enable_debug = !state.debug.enable_debug;
      })
    })
    .addCase(config_actions.TURN_ON_RENAME_MODE, (state, action) => {
      return produce(state, draft => {
        draft.filename.use_uuid = false;
      })
    })
    .addCase(app_actions.RESET_STORE, (state, action) => {
      return default_state;
    })
    // .addCase(files_actions.CLEAR_FILES, (state, aciton) => {
    //   return produce(state, draft => {
    //     draft.csv.file_path_column = default_state.csv.file_path_column;
    //     draft.csv.file_rename_column = default_state.csv.file_rename_column;
    //     draft.csv.file_destination_directory_column = default_state.csv.file_destination_directory_column;
    //   })
    // })
})

export default config_reducer;