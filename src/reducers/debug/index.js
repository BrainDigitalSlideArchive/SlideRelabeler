  import { createReducer}  from "@reduxjs/toolkit";
  import {produce} from 'immer';
  import default_state from './default_state';
  
  import * as debug_actions from '../../actions/debug';
  import * as app_actions from '../../actions/app';
  
  const debug_reducer = createReducer(default_state, (builder) => {
    builder.addCase(debug_actions.SET_HAS_ERROR, (state, action) => {
      return produce(state, draft => {
        draft.has_error = action.payload;
      });
    });
    builder.addCase(debug_actions.ADD_FRONTEND_ERROR_MESSAGE, (state, action) => {
      return produce(state, draft => {
        draft.frontend_error_messages.push(action.payload);
      });
    });
    builder.addCase(debug_actions.CLEAR_FRONTEND_ERROR_MESSAGES, (state, action) => {
      return produce(state, draft => {
        draft.frontend_error_messages = [];
      });
    });
    builder.addCase(debug_actions.SET_BACKEND_ERROR_MESSAGES, (state, action) => {
      return produce(state, draft => {
        draft.backend_error_messages = action.payload;
      });
    });
    builder.addCase(debug_actions.SET_BACKEND_DEBUG_MESSAGES, (state, action) => {
      return produce(state, draft => {
        draft.backend_debug_messages = action.payload;
      });
    });
    builder.addCase(debug_actions.CLEAR_BACKEND_ERROR_MESSAGES, (state, action) => {
      return produce(state, draft => {
        draft.backend_error_messages = [];
      });
    });    
    builder.addCase(debug_actions.SET_DISPLAY_DEBUG, (state, action) => {
      return produce(state, draft => {
        draft.display_debug = action.payload;
      });
    });
    builder.addCase(app_actions.RESET_STORE, (state, action) => {
      return default_state;
    });
  });
  
  export default debug_reducer;