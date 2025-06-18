import { createReducer}  from "@reduxjs/toolkit";

import default_state from './default_state';
import * as viewer_actions from '../../actions/viewer';
import * as app_actions from '../../actions/app';

import {produce} from "immer";

const viewer_reducer  = createReducer(default_state, (builder) => {
  builder.addCase(viewer_actions.UPDATE_VIEWER, (state, action) => {
      return action.payload
  });
  builder.addCase(app_actions.RESET_STORE, (state, action) => {
    return default_state;
  });
})

export default viewer_reducer;