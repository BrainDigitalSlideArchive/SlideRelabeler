import { createReducer } from "@reduxjs/toolkit";
import { produce } from 'immer';

import default_state, { makeEsmSearchRow } from './default_state';
import * as esm_actions from '../../actions/esm';
import * as app_actions from '../../actions/app';
import {
  makeEsmProfile,
  migrateEsmStateToProfiles,
  normalizeSearchRowStain,
  ESM_STAIN_FILTER_ALL,
  ESM_STAIN_FILTER_MATCH,
} from '../../helpers/esm_profile_helpers';
import { makeEmptySearchFeedback } from '../../helpers/esm_search_feedback';

function normalizeSearchRow(raw, profile = null) {
  if (!raw || typeof raw !== 'object') return null;
  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id.trim()
      : makeEsmSearchRow(profile).id;
  const stainNorm = normalizeSearchRowStain(raw);
  return {
    id,
    accession: raw.accession != null ? String(raw.accession) : '',
    blockId: raw.blockId != null ? String(raw.blockId) : '',
    deid: raw.deid != null ? String(raw.deid) : '',
    stainMode: stainNorm.stainMode,
    stain: stainNorm.stain,
  };
}

function normalizeSearchRowsList(list, profile = null) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const item of list) {
    const row = normalizeSearchRow(item, profile);
    if (row) out.push(row);
  }
  return out;
}

function getActiveProfileDraft(draft) {
  const profiles = Array.isArray(draft.profiles) ? draft.profiles : [];
  const activeId = draft.activeProfileId;
  if (activeId) {
    const idx = profiles.findIndex((p) => p && p.id === activeId);
    if (idx !== -1) return { profile: profiles[idx], index: idx, profiles };
  }
  if (profiles.length > 0) return { profile: profiles[0], index: 0, profiles };
  return { profile: null, index: -1, profiles };
}

function updateActiveProfile(draft, updater) {
  const { profile, index, profiles } = getActiveProfileDraft(draft);
  if (!profile || index === -1) return;
  const next = typeof updater === 'function' ? updater(profile) : { ...profile, ...updater };
  profiles[index] = makeEsmProfile(next);
}

const esm_reducer = createReducer(default_state, (builder) => {
  builder
    .addCase(app_actions.RESET_STORE, () => ({
      ...default_state,
      searchFeedback: makeEmptySearchFeedback(),
      searchRows: [makeEsmSearchRow()],
      results: [],
      slidesByAccession: {},
      selectedIds: [],
    }))
    .addCase(esm_actions.SET_ESM_INTEGRATION_ENABLED, (state, action) => {
      return produce(state, (draft) => {
        draft.integrationEnabled = Boolean(action.payload);
      });
    })
    .addCase(esm_actions.SET_ESM_USERNAME, (state, action) => {
      return produce(state, (draft) => {
        draft.username = action.payload;
      });
    })
    .addCase(esm_actions.SET_ESM_REMEMBER_USERNAME, (state, action) => {
      return produce(state, (draft) => {
        draft.rememberUsername = Boolean(action.payload);
        if (!draft.rememberUsername) draft.username = '';
      });
    })
    .addCase(esm_actions.SET_ESM_PASSWORD, (state, action) => {
      return produce(state, (draft) => {
        draft.password = action.payload;
      });
    })
    .addCase(esm_actions.ESM_SET_ACTIVE_PROFILE_ID, (state, action) => {
      return produce(state, (draft) => {
        const id = action.payload;
        if (!id) return;
        const exists = (draft.profiles || []).some((p) => p && p.id === id);
        if (exists) draft.activeProfileId = id;
      });
    })
    .addCase(esm_actions.ESM_ADD_PROFILE, (state, action) => {
      return produce(state, (draft) => {
        const profile = makeEsmProfile(action.payload || {});
        draft.profiles = Array.isArray(draft.profiles) ? draft.profiles : [];
        draft.profiles.push(profile);
        draft.activeProfileId = profile.id;
      });
    })
    .addCase(esm_actions.ESM_UPDATE_PROFILE, (state, action) => {
      return produce(state, (draft) => {
        const p = action.payload;
        if (!p || !p.id) return;
        draft.profiles = Array.isArray(draft.profiles) ? draft.profiles : [];
        const idx = draft.profiles.findIndex((x) => x && x.id === p.id);
        if (idx === -1) return;
        draft.profiles[idx] = makeEsmProfile({ ...draft.profiles[idx], ...p });
      });
    })
    .addCase(esm_actions.ESM_DELETE_PROFILE, (state, action) => {
      return produce(state, (draft) => {
        const id = action.payload;
        if (!id) return;
        draft.profiles = Array.isArray(draft.profiles) ? draft.profiles : [];
        if (draft.profiles.length <= 1) return;
        draft.profiles = draft.profiles.filter((p) => p && p.id !== id);
        if (draft.activeProfileId === id) {
          draft.activeProfileId = draft.profiles[0]?.id ?? null;
        }
      });
    })
    .addCase(esm_actions.ESM_LOGIN_SUCCESS, (state, action) => {
      return produce(state, (draft) => {
        draft.authenticated = true;
        draft.authToken = action.payload;
        draft.loading = false;
        draft.error = false;
        draft.errorMessage = null;
        draft.profileSwitchOpen = false;
        draft.switchOriginProfileId = null;
      });
    })
    .addCase(esm_actions.ESM_LOGIN_ERROR, (state, action) => {
      return produce(state, (draft) => {
        draft.authenticated = false;
        draft.authToken = null;
        draft.loading = false;
        draft.error = true;
        draft.errorMessage = action.payload;
        draft.profileSwitchOpen = false;
        draft.switchOriginProfileId = null;
      });
    })
    .addCase(esm_actions.ESM_LOGOUT_SUCCESS, (state) => {
      return produce(state, (draft) => {
        draft.authenticated = false;
        draft.authToken = null;
        draft.loading = false;
        draft.error = false;
        draft.errorMessage = null;
        draft.password = '';
        if (!draft.rememberUsername) draft.username = '';
      });
    })
    .addCase(esm_actions.ESM_OPEN_PROFILE_SWITCH, (state) => {
      return produce(state, (draft) => {
        draft.profileSwitchOpen = true;
        draft.switchOriginProfileId = draft.activeProfileId ?? null;
        draft.error = false;
        draft.errorMessage = null;
      });
    })
    .addCase(esm_actions.ESM_CLOSE_PROFILE_SWITCH, (state) => {
      return produce(state, (draft) => {
        draft.profileSwitchOpen = false;
        draft.switchOriginProfileId = null;
        draft.error = false;
        draft.errorMessage = null;
      });
    })
    .addCase(esm_actions.ESM_CONFIRM_PROFILE_SWITCH, (state, action) => {
      return produce(state, (draft) => {
        const id = action.payload ?? draft.activeProfileId;
        if (id) {
          const exists = (draft.profiles || []).some((p) => p && p.id === id);
          if (exists) draft.activeProfileId = id;
        }
        draft.profileSwitchOpen = false;
        draft.switchOriginProfileId = null;
        draft.error = false;
        draft.errorMessage = null;
      });
    })
    .addCase(esm_actions.ESM_SET_LOADING, (state, action) => {
      return produce(state, (draft) => {
        draft.loading = action.payload;
      });
    })
    .addCase(esm_actions.ESM_SET_SEARCH_ROWS, (state, action) => {
      return produce(state, (draft) => {
        const { profile } = getActiveProfileDraft(draft);
        const next = normalizeSearchRowsList(action.payload, profile);
        draft.searchRows = next.length > 0 ? next : [makeEsmSearchRow(profile)];
      });
    })
    .addCase(esm_actions.ESM_ADD_SEARCH_ROW, (state, action) => {
      return produce(state, (draft) => {
        const { profile } = getActiveProfileDraft(draft);
        draft.searchRows = Array.isArray(draft.searchRows) ? draft.searchRows : [];
        const row = makeEsmSearchRow(profile);
        const idx =
          typeof action.payload === 'number' && action.payload >= 0 && action.payload <= draft.searchRows.length
            ? action.payload
            : draft.searchRows.length;
        draft.searchRows.splice(idx, 0, row);
      });
    })
    .addCase(esm_actions.ESM_UPDATE_SEARCH_ROW, (state, action) => {
      return produce(state, (draft) => {
        const p = action.payload && typeof action.payload === 'object' ? action.payload : {};
        const id = p.id;
        if (!id) return;
        draft.searchRows = Array.isArray(draft.searchRows) ? draft.searchRows : [];
        const idx = draft.searchRows.findIndex((r) => r && r.id === id);
        if (idx === -1) return;
        const cur = draft.searchRows[idx];
        let stainMode = p.stainMode !== undefined ? p.stainMode : cur.stainMode;
        let stain = p.stain !== undefined ? String(p.stain) : cur.stain;
        if (p.stain !== undefined && p.stainMode === undefined) {
          stainMode = stain.trim() ? ESM_STAIN_FILTER_MATCH : ESM_STAIN_FILTER_ALL;
        }
        const stainNorm = normalizeSearchRowStain({ stainMode, stain });
        draft.searchRows[idx] = {
          ...cur,
          accession: p.accession !== undefined ? String(p.accession) : cur.accession,
          blockId: p.blockId !== undefined ? String(p.blockId) : cur.blockId,
          deid: p.deid !== undefined ? String(p.deid) : cur.deid,
          stainMode: stainNorm.stainMode,
          stain: stainNorm.stain,
        };
      });
    })
    .addCase(esm_actions.ESM_REMOVE_SEARCH_ROW, (state, action) => {
      return produce(state, (draft) => {
        const id = action.payload;
        if (!id) return;
        const { profile } = getActiveProfileDraft(draft);
        draft.searchRows = Array.isArray(draft.searchRows) ? draft.searchRows : [];
        if (draft.searchRows.length <= 1) return;
        draft.searchRows = draft.searchRows.filter((r) => r && r.id !== id);
        if (draft.searchRows.length === 0) draft.searchRows = [makeEsmSearchRow(profile)];
      });
    })
    .addCase(esm_actions.ESM_SEARCH, (state) => {
      return produce(state, (draft) => {
        draft.searchLoading = true;
        draft.searchFeedback = makeEmptySearchFeedback();
        draft.slidesByAccession = {};
        draft.results = [];
        draft.selectedIds = [];
      });
    })
    .addCase(esm_actions.ESM_SEARCH_COMPLETE, (state, action) => {
      return produce(state, (draft) => {
        const p = action.payload && typeof action.payload === 'object' ? action.payload : {};
        draft.searchLoading = false;
        draft.searchFeedback = {
          level: p.level ?? 'none',
          messages: Array.isArray(p.messages) ? p.messages : [],
          outcomes: Array.isArray(p.outcomes) ? p.outcomes : [],
          stagingRowCount: typeof p.stagingRowCount === 'number' ? p.stagingRowCount : 0,
          completed: Boolean(p.completed),
        };
      });
    })
    .addCase(esm_actions.ESM_SEARCH_SUCCESS, (state) => {
      return produce(state, (draft) => {
        draft.searchLoading = false;
      });
    })
    .addCase(esm_actions.ESM_SEARCH_ERROR, (state, action) => {
      return produce(state, (draft) => {
        draft.searchLoading = false;
        draft.searchFeedback = {
          level: 'error',
          messages: [action.payload || 'Search failed'],
          outcomes: [],
          stagingRowCount: 0,
          completed: false,
        };
      });
    })
    .addCase(esm_actions.ESM_SET_RESULTS, (state, action) => {
      return produce(state, (draft) => {
        draft.results = Array.isArray(action.payload) ? action.payload : [];
        draft.selectedIds = [];
      });
    })
    .addCase(esm_actions.ESM_SET_SLIDES_BY_ACCESSION, (state, action) => {
      return produce(state, (draft) => {
        const p = action.payload && typeof action.payload === 'object' ? action.payload : {};
        draft.slidesByAccession = { ...p };
        draft.selectedIds = [];
      });
    })
    .addCase(esm_actions.ESM_CLEAR_RESULTS, (state) => {
      return produce(state, (draft) => {
        draft.results = [];
        draft.slidesByAccession = {};
        draft.selectedIds = [];
      });
    })
    .addCase(esm_actions.ESM_SET_SELECTION, (state, action) => {
      return produce(state, (draft) => {
        draft.selectedIds = Array.isArray(action.payload) ? action.payload : [];
      });
    })
    .addCase(esm_actions.ESM_ADD_TRANSFORM_RULE, (state, action) => {
      return produce(state, (draft) => {
        if (!action.payload || typeof action.payload !== 'object') return;
        updateActiveProfile(draft, (profile) => ({
          ...profile,
          transformRules: [...(profile.transformRules || []), action.payload],
        }));
      });
    })
    .addCase(esm_actions.ESM_UPDATE_TRANSFORM_RULE, (state, action) => {
      return produce(state, (draft) => {
        const rule = action.payload;
        if (!rule || typeof rule !== 'object' || !rule.id) return;
        updateActiveProfile(draft, (profile) => {
          const rules = Array.isArray(profile.transformRules) ? [...profile.transformRules] : [];
          const idx = rules.findIndex((r) => r && r.id === rule.id);
          if (idx === -1) return profile;
          rules[idx] = { ...rules[idx], ...rule };
          return { ...profile, transformRules: rules };
        });
      });
    })
    .addCase(esm_actions.ESM_DELETE_TRANSFORM_RULE, (state, action) => {
      return produce(state, (draft) => {
        const id = action.payload;
        if (!id) return;
        updateActiveProfile(draft, (profile) => ({
          ...profile,
          transformRules: (profile.transformRules || []).filter((r) => r && r.id !== id),
        }));
      });
    })
    .addCase(esm_actions.UPDATE_ESM, (state, action) => {
      const incoming = action.payload && typeof action.payload === 'object' ? action.payload : {};
      const migrated = migrateEsmStateToProfiles(incoming);
      const profiles = Array.isArray(migrated.profiles)
        ? migrated.profiles.map((p) => makeEsmProfile(p))
        : default_state.profiles;
      const activeProfile = profiles.find((p) => p.id === migrated.activeProfileId) || profiles[0];

      return {
        ...default_state,
        integrationEnabled: migrated.integrationEnabled !== false,
        rememberUsername: Boolean(migrated.rememberUsername),
        username: migrated.rememberUsername ? (migrated.username ?? '') : '',
        profiles,
        activeProfileId: activeProfile?.id ?? profiles[0]?.id,
        authenticated: false,
        authToken: null,
        loading: false,
        error: false,
        errorMessage: null,
        searchLoading: false,
        searchFeedback: makeEmptySearchFeedback(),
        searchRows: [makeEsmSearchRow(activeProfile)],
        results: [],
        slidesByAccession: {},
        selectedIds: [],
      };
    });
});

export default esm_reducer;
