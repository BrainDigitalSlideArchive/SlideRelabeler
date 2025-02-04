import { createReducer}  from "@reduxjs/toolkit";

import default_state from './default_state';
import * as modal_actions from '../../actions/modal';
import {produce} from "immer";

const modal_reducer  = createReducer(default_state, (builder) => {
  builder
    .addCase(modal_actions.UPDATE_MODAL, (state, action) => {
      return action.payload
    })
    .addCase(modal_actions.TOGGLE_MODAL, (state, action) => {
      return produce(state, draft => {
        draft.type = action.payload.type;
        draft.active = !state.active;
      })
    })
})

export default modal_reducer;