import { createReducer } from "@reduxjs/toolkit";
import { produce } from 'immer';

import default_state from './default_state';
import * as esm_actions from '../../actions/esm';

/**
 * Reducer for eSlideManager state
 * Handles authentication, search, and UI state
 */
const esm_reducer = createReducer(default_state, (builder) => {
  builder
    .addCase(esm_actions.SET_ESM_URL, (state, action) => {
      return produce(state, draft => {
        draft.url = action.payload;
      })
    })
    .addCase(esm_actions.SET_ESM_USERNAME, (state, action) => {
      return produce(state, draft => {
        draft.username = action.payload;
      })
    })
    .addCase(esm_actions.SET_ESM_PASSWORD, (state, action) => {
      return produce(state, draft => {
        draft.password = action.payload;
      })
    })
    .addCase(esm_actions.ESM_LOGIN_SUCCESS, (state, action) => {
      return produce(state, draft => {
        draft.authenticated = true;
        draft.authToken = action.payload;
        draft.loading = false;
        draft.error = false;
        draft.errorMessage = null;
      })
    })
    .addCase(esm_actions.ESM_LOGIN_ERROR, (state, action) => {
      return produce(state, draft => {
        draft.authenticated = false;
        draft.authToken = null;
        draft.loading = false;
        draft.error = true;
        draft.errorMessage = action.payload;
      })
    })
    .addCase(esm_actions.ESM_LOGOUT_SUCCESS, (state, action) => {
      return produce(state, draft => {
        draft.authenticated = false;
        draft.authToken = null;
        draft.loading = false;
        draft.error = false;
        draft.errorMessage = null;
        draft.username = '';
        draft.password = '';
      })
    })
    .addCase(esm_actions.ESM_SET_LOADING, (state, action) => {
      return produce(state, draft => {
        draft.loading = action.payload;
      })
    })
    .addCase(esm_actions.ESM_SEARCH, (state, action) => {
      return produce(state, draft => {
        draft.searchLoading = true;
        draft.searchError = false;
        draft.searchErrorMessage = null;
      })
    })
    .addCase(esm_actions.ESM_SEARCH_SUCCESS, (state, action) => {
      return produce(state, draft => {
        draft.searchLoading = false;
        draft.searchError = false;
        draft.searchErrorMessage = null;
      })
    })
    .addCase(esm_actions.ESM_SEARCH_ERROR, (state, action) => {
      return produce(state, draft => {
        draft.searchLoading = false;
        draft.searchError = true;
        draft.searchErrorMessage = action.payload;
      })
    })
})

export default esm_reducer;
