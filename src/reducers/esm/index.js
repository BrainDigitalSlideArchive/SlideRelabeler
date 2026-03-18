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

    // ----------------------
    // Results + selection + mapping config
    // ----------------------
    .addCase(esm_actions.ESM_SET_RESULTS, (state, action) => {
      return produce(state, draft => {
        draft.results = Array.isArray(action.payload) ? action.payload : [];
        draft.selectedIds = [];
      })
    })
    .addCase(esm_actions.ESM_CLEAR_RESULTS, (state, action) => {
      return produce(state, draft => {
        draft.results = [];
        draft.selectedIds = [];
      })
    })
    .addCase(esm_actions.ESM_SET_SELECTION, (state, action) => {
      return produce(state, draft => {
        draft.selectedIds = Array.isArray(action.payload) ? action.payload : [];
      })
    })
    .addCase(esm_actions.ESM_SET_MAPPING_CONFIG, (state, action) => {
      return produce(state, draft => {
        const next = action.payload && typeof action.payload === "object" ? action.payload : {};
        draft.mappingConfig = {
          ...draft.mappingConfig,
          ...next,
        };
      })
    })
    // ----------------------
    // Transform rules (site-specific normalization)
    // ----------------------
    .addCase(esm_actions.ESM_ADD_TRANSFORM_RULE, (state, action) => {
      return produce(state, draft => {
        if (!action.payload || typeof action.payload !== "object") return;
        draft.transformRules = Array.isArray(draft.transformRules) ? draft.transformRules : [];
        draft.transformRules.push(action.payload);
      })
    })
    .addCase(esm_actions.ESM_UPDATE_TRANSFORM_RULE, (state, action) => {
      return produce(state, draft => {
        const rule = action.payload;
        if (!rule || typeof rule !== "object" || !rule.id) return;
        draft.transformRules = Array.isArray(draft.transformRules) ? draft.transformRules : [];
        const idx = draft.transformRules.findIndex((r) => r && r.id === rule.id);
        if (idx === -1) return;
        draft.transformRules[idx] = {
          ...draft.transformRules[idx],
          ...rule,
        };
      })
    })
    .addCase(esm_actions.ESM_DELETE_TRANSFORM_RULE, (state, action) => {
      return produce(state, draft => {
        const id = action.payload;
        if (!id) return;
        draft.transformRules = Array.isArray(draft.transformRules) ? draft.transformRules : [];
        draft.transformRules = draft.transformRules.filter((r) => r && r.id !== id);
        draft.selectedTransformRuleIds = Array.isArray(draft.selectedTransformRuleIds) ? draft.selectedTransformRuleIds : [];
        draft.selectedTransformRuleIds = draft.selectedTransformRuleIds.filter((x) => x !== id);
      })
    })
    .addCase(esm_actions.ESM_SET_SELECTED_TRANSFORM_RULE_IDS, (state, action) => {
      return produce(state, draft => {
        draft.selectedTransformRuleIds = Array.isArray(action.payload) ? action.payload : [];
      })
    })
    .addCase(esm_actions.UPDATE_ESM, (state, action) => {
      const incoming = action.payload && typeof action.payload === "object" ? action.payload : {};
      return {
        ...default_state,
        ...incoming,
        // Merge nested config objects to keep defaults for newly added keys
        mappingConfig: {
          ...default_state.mappingConfig,
          ...(incoming.mappingConfig && typeof incoming.mappingConfig === "object" ? incoming.mappingConfig : {}),
        },
        // Ensure arrays are always arrays
        results: Array.isArray(incoming.results) ? incoming.results : default_state.results,
        selectedIds: Array.isArray(incoming.selectedIds) ? incoming.selectedIds : default_state.selectedIds,
        transformRules: Array.isArray(incoming.transformRules) ? incoming.transformRules : default_state.transformRules,
        selectedTransformRuleIds: Array.isArray(incoming.selectedTransformRuleIds) ? incoming.selectedTransformRuleIds : default_state.selectedTransformRuleIds,
      };
    })
})

export default esm_reducer;
