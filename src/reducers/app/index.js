import { createReducer}  from "@reduxjs/toolkit";
import defaultState from './default_state';

import * as app_actions from '../../actions/app';

const app_reducer  = createReducer(defaultState, (builder) => {
    builder
      .addCase(app_actions.UPDATE_APP, (state, action) => {
        return action.payload;
      })
      .addCase(app_actions.INIT_APP, (state, action) => {
          return state;
      })
      .addCase(app_actions.RESET_STORE, (state, action) => {
        return defaultState;
      });
})

export default app_reducer;