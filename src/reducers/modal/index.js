import { createReducer}  from "@reduxjs/toolkit";

import default_state from './default_state';
import {produce} from "immer";

import * as app_actions from '../../actions/app';
import * as modal_actions from '../../actions/modal';

const modal_reducer  = createReducer(default_state, (builder) => {
  builder
    .addCase(modal_actions.UPDATE_MODAL, (state, action) => {
      return action.payload
    })
    .addCase(modal_actions.TOGGLE_MODAL, (state, action) => {
      return produce(state, draft => {
        draft.type = action.payload.type;
        draft.active = !state.active;
      })
    })
    .addCase(modal_actions.DISPLAY_ERROR_MESSAGE, (state, action) => {
      return produce(state, draft => {
        draft.type = 'error';
        draft.error_messages = [...state.error_messages, action.payload];
        draft.active = true;
      });
    })
    .addCase(modal_actions.DISPLAY_WARNING_MESSAGE, (state, action) => {
      return produce(state, draft => {
        draft.type = 'warning';
        draft.warning_messages = [...state.warning_messages, action.payload];
        draft.active = true;
      });
    })
    .addCase(modal_actions.CLEAR_MESSAGES, (state, action) => {
      return produce(state, draft => {
        draft.error_messages = [];
        draft.warning_messages = [];
      });
    })
    .addCase(app_actions.RESET_STORE, (state, action) => {
      return default_state;
    })
    .addCase(modal_actions.ALLOW_SELECT_CSV_PATH_COLUMN, (state, action) => {
      return produce(state, draft => {
        draft.allow_select_csv_path_column = true;
      });
    })
    .addCase(modal_actions.ALLOW_SELECT_CSV_RENAME_COLUMN, (state, action) => {
      return produce(state, draft => {
        draft.allow_select_csv_rename_column = true;
      });
    })
    .addCase(modal_actions.ALLOW_SELECT_CSV_DESTINATION_DIRECTORY_COLUMN, (state, action) => {
      return produce(state, draft => {
        draft.allow_select_csv_destination_directory_column = true;
      });
    })
    .addCase(modal_actions.DISALLOW_SELECT_CSV, (state, action) => {
      return produce(state, draft => {
        draft.allow_select_csv_path_column = false;
        draft.allow_select_csv_rename_column = false;
        draft.allow_select_csv_destination_directory_column = false;
      });
    })
    .addCase(modal_actions.CLOSE_MODAL, (state, action) => {
      return produce(state, draft => {
        draft.active = false;
      });
    })
})

export default modal_reducer;