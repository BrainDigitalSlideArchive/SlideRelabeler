import { createReducer } from '@reduxjs/toolkit';
import { produce } from 'immer';

import * as app_actions from '../../actions/app';
import * as config_profiles_actions from '../../actions/configProfiles';
import default_state from './default_state';

const configProfiles_reducer = createReducer(default_state, (builder) => {
  builder
    .addCase(config_profiles_actions.HYDRATE_CONFIG_PROFILES, (state, action) => {
      const payload = action.payload || {};
      return {
        profiles: Array.isArray(payload.profiles) ? payload.profiles : [],
        activeProfileId: payload.activeProfileId ?? null,
        activeFingerprint: payload.activeFingerprint ?? null,
      };
    })
    .addCase(config_profiles_actions.CLEAR_ACTIVE_CONFIG_PROFILE, (state) =>
      produce(state, (draft) => {
        draft.activeProfileId = null;
        draft.activeFingerprint = null;
      }),
    )
    .addCase(config_profiles_actions.SET_ACTIVE_CONFIG_PROFILE, (state, action) =>
      produce(state, (draft) => {
        draft.activeProfileId = action.payload?.id ?? null;
        draft.activeFingerprint = action.payload?.fingerprint ?? null;
      }),
    )
    .addCase(app_actions.RESET_STORE, () => ({ ...default_state }));
});

export default configProfiles_reducer;
