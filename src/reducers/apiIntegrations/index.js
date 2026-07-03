import { createReducer } from '@reduxjs/toolkit';
import { produce } from 'immer';

import default_state from './default_state';
import * as api_integrations_actions from '../../actions/apiIntegrations';
import { getApiIntegrationById } from '../../helpers/api_integrations';
import * as app_actions from '../../actions/app';

const apiIntegrations_reducer = createReducer(default_state, (builder) => {
  builder
    .addCase(api_integrations_actions.SET_LAST_SELECTED_API_INTEGRATION, (state, action) => {
      const id = action.payload;
      if (!getApiIntegrationById(id)) return state;
      return produce(state, (draft) => {
        draft.lastSelectedId = id;
      });
    })
    .addCase(api_integrations_actions.RESTORE_API_INTEGRATIONS, (state, action) => {
      const payload = action.payload || {};
      const id = payload.lastSelectedId;
      return produce(state, (draft) => {
        draft.lastSelectedId = getApiIntegrationById(id) ? id : default_state.lastSelectedId;
      });
    })
    .addCase(app_actions.RESET_STORE, () => ({ ...default_state }));
});

export default apiIntegrations_reducer;
