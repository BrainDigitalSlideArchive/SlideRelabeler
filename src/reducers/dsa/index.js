import { createReducer } from "@reduxjs/toolkit";

import default_state from './default_state.js';
import * as dsa_actions from '../../actions/dsa.js';
import * as app_actions from '../../actions/app.js';
import { produce } from "immer";

const dsa_reducer = createReducer(default_state, (builder) => {
  builder
    .addCase(app_actions.RESET_STORE, () => ({ ...default_state }))
    .addCase(dsa_actions.LOGIN_SUCCESS, (state, action) => {
      return produce(state, draft => {
        draft.api_auth = action.payload;
        draft.connected = true;
        draft.login_error = false;
        draft.login_error_message = null;
      })
    })
    .addCase(dsa_actions.LOGIN_FAILURE, (state, action) => {
      return produce(state, draft => {
        draft.api_auth = null;
        draft.login_error = true;
        draft.login_error_message = action.payload;
      })
    })
    .addCase(dsa_actions.LOGOUT_SUCCESS, (state, action) => {
      return produce(state, draft => {
        draft.api_auth = null;
        draft.login_error = false;
        draft.login_error_message = null;
      })
    })
    .addCase(dsa_actions.SET_DSA_API_URL, (state, action) => {
      return produce(state, draft => {
        draft.api_url = action.payload;
      })
    })
    .addCase(dsa_actions.SET_DSA_USERNAME, (state, action) => {
      return produce(state, draft => {
        draft.username = action.payload;
      })
    })
    .addCase(dsa_actions.SET_DSA_PASSWORD, (state, action) => {
      return produce(state, draft => {
        draft.password = action.payload;
      })
    })
    .addCase(dsa_actions.SET_DSA_FOLDER_ID, (state, action) => {
      return produce(state, draft => {
        const nextId = action.payload == null ? '' : String(action.payload);
        draft.folder_id = nextId;
        if (!nextId.trim()) {
          draft.folder_path = '';
          draft.dsa_folder_exists = null;
          draft.dsa_folder_error_message = null;
        }
      })
    })
    .addCase(dsa_actions.SET_DSA_FOLDER_PATH, (state, action) => {
      return produce(state, draft => {
        draft.folder_path = action.payload == null ? '' : String(action.payload);
      })
    })
    .addCase(dsa_actions.TOGGLE_UPLOAD_TO_DSA, (state, action) => {
      return produce(state, draft => {
        draft.upload = !draft.upload;
      })
    })
    .addCase(dsa_actions.TOGGLE_DELETE_AFTER_DSA_UPLOAD, (state, action) => {
      return produce(state, draft => {
        draft.delete_after = !draft.delete_after;
      })
    })
    .addCase(dsa_actions.ADD_UPLOAD_FILE_TO_QUEUE, (state, action) => {
      return produce(state, draft => {
        draft.upload_queue.push(action.payload);
      })
    })
    .addCase(dsa_actions.REMOVE_UPLOAD_FILE_FROM_QUEUE, (state, action) => {
      return produce(state, draft => {
        for (let idx in draft.upload_queue) {
          if (draft.upload_queue[idx].row_idx === action.payload) {
            draft.upload_queue.splice(idx, 1);
            break;
          }
        }
      })
    })
    .addCase(dsa_actions.DSA_FOLDER_EXISTS, (state, action) => {
      return produce(state, draft => {
        draft.dsa_folder_exists = true;
        draft.dsa_folder_error_message = null;
      })
    })
    .addCase(dsa_actions.DSA_FOLDER_DOES_NOT_EXIST, (state, action) => {
      return produce(state, draft => {
        draft.dsa_folder_exists = false;
        draft.dsa_folder_error_message = action.payload;
      })
    })
    .addCase(dsa_actions.UPDATE_DSA, (state, action) => {
      return produce(state, draft => {
        const p = action.payload || {};
        for (const k of Object.keys(p)) {
          if (p[k] !== undefined) draft[k] = p[k];
        }
      })
    })
})

export default dsa_reducer;