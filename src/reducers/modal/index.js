import { createReducer}  from "@reduxjs/toolkit";

import default_state from './default_state.js';
import {produce} from "immer";

import * as app_actions from '../../actions/app.js';
import * as modal_actions from '../../actions/modal.js';

function stackTop(stack) {
  return stack.length > 0 ? stack[stack.length - 1] : undefined;
}

const modal_reducer  = createReducer(default_state, (builder) => {
  builder
    .addCase(modal_actions.UPDATE_MODAL, (state, action) => {
      return action.payload
    })
    .addCase(modal_actions.TOGGLE_MODAL, (state, action) => {
      return produce(state, (draft) => {
        const nextType = action.payload.type;
        if (stackTop(draft.stack) === nextType) {
          draft.stack.pop();
        } else {
          draft.stack.push(nextType);
        }
      });
    })
    .addCase(modal_actions.DISPLAY_ERROR_MESSAGE, (state, action) => {
      return produce(state, draft => {
        draft.error_messages = [...state.error_messages, action.payload];
        if (stackTop(draft.stack) !== 'error') {
          draft.stack.push('error');
        }
      });
    })
    .addCase(modal_actions.DISPLAY_WARNING_MESSAGE, (state, action) => {
      return produce(state, draft => {
        draft.warning_messages = [...state.warning_messages, action.payload];
        if (stackTop(draft.stack) !== 'warning') {
          draft.stack.push('warning');
        }
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
    .addCase(modal_actions.ALLOW_SELECT_CSV_LABEL_COLUMN, (state, action) => {
      return produce(state, draft => {
        draft.allow_select_csv_label_column = true;
      });
    })
    .addCase(modal_actions.ALLOW_SELECT_CSV_QR_COLUMN, (state, action) => {
      return produce(state, draft => {
        draft.allow_select_csv_qr_column = true;
      });
    })
    .addCase(modal_actions.DISALLOW_SELECT_CSV, (state, action) => {
      return produce(state, draft => {
        draft.allow_select_csv_path_column = false;
        draft.allow_select_csv_rename_column = false;
        draft.allow_select_csv_destination_directory_column = false;
        draft.allow_select_csv_label_column = false;
        draft.allow_select_csv_qr_column = false;
      });
    })
    .addCase(modal_actions.CLOSE_MODAL, (state, action) => {
      return produce(state, draft => {
        const popped = draft.stack.pop();
        if (popped === 'error' || popped === 'warning') {
          draft.error_messages = [];
          draft.warning_messages = [];
        }
      });
    })
    .addCase(modal_actions.CHANGE_NETWORK, (state, action) => {
      return produce(state, draft => {
        draft.network_type = action.payload;
      });
    })
    .addCase(modal_actions.TOGGLE_DISPLAY_CHANGED_ONLY, (state, action) => {
      return produce(state, draft => {
        draft.display_changed_only = !draft.display_changed_only;
      });
    })
})

export default modal_reducer;
