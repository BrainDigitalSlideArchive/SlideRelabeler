import { createReducer } from '@reduxjs/toolkit';
import { produce } from 'immer';

import default_state from './default_state';
import * as upload_routing_actions from '../../actions/uploadRouting';
import * as app_actions from '../../actions/app';

const uploadRouting_reducer = createReducer(default_state, (builder) => {
  builder
    .addCase(upload_routing_actions.RESTORE_UPLOAD_ROUTING, (state, action) => {
      const p = action.payload || {};
      return produce(state, (draft) => {
        draft.auto_upload = !!p.auto_upload;
        draft.delete_local_after = !!p.delete_local_after;
        const v = parseInt(p.max_local_pending, 10);
        draft.max_local_pending =
          Number.isFinite(v) && v >= 1 && v <= 50 ? v : 2;
        draft.destination = p.destination === 'globus' ? 'globus' : 'dsa';
      });
    })
    .addCase(upload_routing_actions.SET_AUTO_UPLOAD, (state, action) => {
      return produce(state, (draft) => {
        draft.auto_upload = !!action.payload;
      });
    })
    .addCase(upload_routing_actions.TOGGLE_AUTO_UPLOAD, (state) => {
      return produce(state, (draft) => {
        draft.auto_upload = !draft.auto_upload;
      });
    })
    .addCase(upload_routing_actions.SET_DELETE_LOCAL_AFTER, (state, action) => {
      return produce(state, (draft) => {
        draft.delete_local_after = !!action.payload;
      });
    })
    .addCase(upload_routing_actions.TOGGLE_DELETE_LOCAL_AFTER, (state) => {
      return produce(state, (draft) => {
        draft.delete_local_after = !draft.delete_local_after;
      });
    })
    .addCase(upload_routing_actions.SET_MAX_LOCAL_PENDING, (state, action) => {
      return produce(state, (draft) => {
        const v = parseInt(action.payload, 10);
        if (Number.isFinite(v) && v >= 1 && v <= 50) draft.max_local_pending = v;
      });
    })
    .addCase(upload_routing_actions.SET_UPLOAD_DESTINATION, (state, action) => {
      return produce(state, (draft) => {
        const d = action.payload;
        if (d === 'globus' || d === 'dsa') draft.destination = d;
      });
    })
    .addCase(upload_routing_actions.SET_AUTO_UPLOAD_MODE, (state, action) => {
      const mode = action.payload;
      return produce(state, (draft) => {
        if (mode === 'off') {
          draft.auto_upload = false;
        } else if (mode === 'dsa') {
          draft.auto_upload = true;
          draft.destination = 'dsa';
        } else if (mode === 'globus') {
          draft.auto_upload = true;
          draft.destination = 'globus';
        }
      });
    })
    .addCase(app_actions.RESET_STORE, () => ({ ...default_state }));
});

export default uploadRouting_reducer;
