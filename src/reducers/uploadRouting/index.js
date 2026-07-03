import { createReducer } from '@reduxjs/toolkit';
import { produce } from 'immer';

import default_state from './default_state';
import * as upload_routing_actions from '../../actions/uploadRouting';
import * as app_actions from '../../actions/app';
import { normalizeStagingDirMode } from '../../helpers/staging_path.js';

function restoreKeepLocalCopy(p) {
  if (typeof p.keep_local_copy === 'boolean') return p.keep_local_copy;
  if (typeof p.delete_local_after === 'boolean') return !p.delete_local_after;
  return false;
}

function restoreLocalOutputEnabled(p) {
  if (typeof p.local_output_enabled === 'boolean') return p.local_output_enabled;
  return !p.auto_upload || restoreKeepLocalCopy(p);
}

function syncKeepLocalCopy(draft) {
  draft.keep_local_copy = !!(draft.auto_upload && draft.local_output_enabled);
}

const uploadRouting_reducer = createReducer(default_state, (builder) => {
  builder
    .addCase(upload_routing_actions.RESTORE_UPLOAD_ROUTING, (state, action) => {
      const p = action.payload || {};
      return produce(state, (draft) => {
        draft.auto_upload = !!p.auto_upload;
        draft.local_output_enabled = restoreLocalOutputEnabled(p);
        draft.staging_dir_mode = normalizeStagingDirMode(p.staging_dir_mode);
        draft.staging_dir_custom = typeof p.staging_dir_custom === 'string' ? p.staging_dir_custom : '';
        const v = parseInt(p.max_local_pending, 10);
        draft.max_local_pending =
          Number.isFinite(v) && v >= 1 && v <= 50 ? v : 2;
        const gp = parseInt(p.max_globus_parallel_uploads, 10);
        draft.max_globus_parallel_uploads =
          Number.isFinite(gp) && gp >= 1 && gp <= 16 ? gp : 4;
        draft.destination = p.destination === 'globus' ? 'globus' : 'dsa';
        draft.default_local_output_dir = typeof p.default_local_output_dir === 'string'
          ? p.default_local_output_dir
          : '';
        syncKeepLocalCopy(draft);
      });
    })
    .addCase(upload_routing_actions.SET_DEFAULT_LOCAL_OUTPUT_DIR, (state, action) => {
      return produce(state, (draft) => {
        draft.default_local_output_dir = typeof action.payload === 'string' ? action.payload : '';
      });
    })
    .addCase(upload_routing_actions.SET_LOCAL_OUTPUT_ENABLED, (state, action) => {
      return produce(state, (draft) => {
        draft.local_output_enabled = !!action.payload;
        syncKeepLocalCopy(draft);
      });
    })
    .addCase(upload_routing_actions.TOGGLE_LOCAL_OUTPUT_ENABLED, (state) => {
      return produce(state, (draft) => {
        draft.local_output_enabled = !draft.local_output_enabled;
        syncKeepLocalCopy(draft);
      });
    })
    .addCase(upload_routing_actions.SET_AUTO_UPLOAD, (state, action) => {
      return produce(state, (draft) => {
        draft.auto_upload = !!action.payload;
        syncKeepLocalCopy(draft);
      });
    })
    .addCase(upload_routing_actions.TOGGLE_AUTO_UPLOAD, (state) => {
      return produce(state, (draft) => {
        draft.auto_upload = !draft.auto_upload;
        syncKeepLocalCopy(draft);
      });
    })
    .addCase(upload_routing_actions.SET_KEEP_LOCAL_COPY, (state, action) => {
      return produce(state, (draft) => {
        if (draft.auto_upload) {
          draft.local_output_enabled = !!action.payload;
        }
        syncKeepLocalCopy(draft);
      });
    })
    .addCase(upload_routing_actions.TOGGLE_KEEP_LOCAL_COPY, (state) => {
      return produce(state, (draft) => {
        if (draft.auto_upload) {
          draft.local_output_enabled = !draft.local_output_enabled;
        }
        syncKeepLocalCopy(draft);
      });
    })
    .addCase(upload_routing_actions.SET_STAGING_DIR_MODE, (state, action) => {
      return produce(state, (draft) => {
        draft.staging_dir_mode = normalizeStagingDirMode(action.payload);
      });
    })
    .addCase(upload_routing_actions.SET_STAGING_DIR_CUSTOM, (state, action) => {
      return produce(state, (draft) => {
        draft.staging_dir_custom = typeof action.payload === 'string' ? action.payload : '';
      });
    })
    .addCase(upload_routing_actions.SET_MAX_LOCAL_PENDING, (state, action) => {
      return produce(state, (draft) => {
        const v = parseInt(action.payload, 10);
        if (Number.isFinite(v) && v >= 1 && v <= 50) draft.max_local_pending = v;
      });
    })
    .addCase(upload_routing_actions.SET_MAX_GLOBUS_PARALLEL_UPLOADS, (state, action) => {
      return produce(state, (draft) => {
        const v = parseInt(action.payload, 10);
        if (Number.isFinite(v) && v >= 1 && v <= 16) draft.max_globus_parallel_uploads = v;
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
        syncKeepLocalCopy(draft);
      });
    })
    .addCase(app_actions.RESET_STORE, () => ({ ...default_state }));
});

export default uploadRouting_reducer;
