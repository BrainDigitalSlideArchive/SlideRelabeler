import { createReducer } from "@reduxjs/toolkit";

import default_state from './default_state';
import * as dsa_actions from '../../actions/dsa';
import { produce } from "immer";

const dsa_reducer = createReducer(default_state, (builder) => {
  builder
    .addCase(dsa_actions.LOGIN_SUCCESS, (state, action) => {
      return produce(state, draft => {
        draft.api_auth = action.payload;
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
        draft.folder_id = action.payload;
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
})

export default dsa_reducer;