import { createReducer } from "@reduxjs/toolkit";

import default_state from './default_state';
import * as globus_actions from '../../actions/globus';
import * as app_actions from '../../actions/app';
import { produce } from "immer";

const globus_reducer = createReducer(default_state, (builder) => {
  builder
    .addCase(app_actions.RESET_STORE, () => ({ ...default_state }))
    .addCase(globus_actions.RESTORE_GLOBUS_PERSISTED, (state, action) => {
      const persisted = action.payload || {};
      const allowlist = [
        'disable_ssl_verification',
        'collection_name',
        'target_endpoint_id',
        'target_endpoint_label',
        'remember_target_endpoint',
        'saved_target_endpoint_id',
        'saved_target_endpoint_label',
        'collection_path',
        'source_endpoint',
        'upload',
        'delete_after',
      ];

      return produce(state, draft => {
        for (const key of allowlist) {
          if (Object.prototype.hasOwnProperty.call(persisted, key)) {
            draft[key] = persisted[key];
          }
        }
        if (draft.remember_target_endpoint && draft.saved_target_endpoint_id && !draft.target_endpoint_id) {
          draft.target_endpoint_id = draft.saved_target_endpoint_id;
          draft.target_endpoint_label = draft.saved_target_endpoint_label || '';
        }
      });
    })
    .addCase(globus_actions.LOGIN_SUCCESS, (state, action) => {
      console.log('[Globus Reducer] LOGIN_SUCCESS action received');
      console.log('[Globus Reducer] Current state:', {
        api_auth: state.api_auth,
        login_pending: state.login_pending,
        login_url: state.login_url,
        access_code: state.access_code,
        login_error: state.login_error,
        login_error_message: state.login_error_message
      });
      console.log('[Globus Reducer] Action payload:', action.payload);
      return produce(state, draft => {
        draft.api_auth = action.payload;
        draft.login_error = false;
        draft.login_error_message = null;
        draft.auth_check_pending = false;
        // Clear login info when authentication succeeds
        draft.login_url = null;
        draft.access_code = null;
        draft.login_pending = false;
        draft.globus_directory_refresh_nonce = (draft.globus_directory_refresh_nonce || 0) + 1;
      })
    })
    .addCase(globus_actions.BUMP_GLOBUS_DIRECTORY_REFRESH, (state) => {
      return produce(state, draft => {
        draft.globus_directory_refresh_nonce = (draft.globus_directory_refresh_nonce || 0) + 1;
      });
    })
    .addCase(globus_actions.LOGIN_FAILURE, (state, action) => {
      console.log('[Globus Reducer] LOGIN_FAILURE action received');
      console.log('[Globus Reducer] Current state:', {
        api_auth: state.api_auth,
        login_pending: state.login_pending,
        login_url: state.login_url,
        access_code: state.access_code,
        login_error: state.login_error,
        login_error_message: state.login_error_message
      });
      console.log('[Globus Reducer] Action payload (error message):', action.payload);
      return produce(state, draft => {
        draft.api_auth = null;
        draft.auth_check_pending = false;
        draft.login_error = true;
        draft.login_error_message = action.payload;
        console.log('[Globus Reducer] New state after LOGIN_FAILURE:', {
          api_auth: draft.api_auth,
          login_pending: draft.login_pending,
          login_url: draft.login_url,
          access_code: draft.access_code,
          login_error: draft.login_error,
          login_error_message: draft.login_error_message
        });
      })
    })
    .addCase(globus_actions.LOGOUT_SUCCESS, (state, action) => {
      return produce(state, draft => {
        draft.api_auth = null;
        draft.login_error = false;
        draft.login_error_message = null;
      })
    })
    .addCase(globus_actions.SET_GLOBUS_USERNAME, (state, action) => {
      return produce(state, draft => {
        draft.username = action.payload;
      })
    })
    .addCase(globus_actions.SET_GLOBUS_PASSWORD, (state, action) => {
      return produce(state, draft => {
        draft.password = action.payload;
      })
    })
    .addCase(globus_actions.SET_GLOBUS_COLLECTION_NAME, (state, action) => {
      return produce(state, draft => {
        draft.collection_name = action.payload;
      })
    })
    .addCase(globus_actions.SET_GLOBUS_TARGET_ENDPOINT, (state, action) => {
      return produce(state, draft => {
        const endpointId = action?.payload?.id ? String(action.payload.id).trim() : '';
        const endpointLabel = action?.payload?.label ? String(action.payload.label).trim() : '';
        draft.target_endpoint_id = endpointId;
        draft.target_endpoint_label = endpointLabel;
        draft.globus_collection_exists = null;
        draft.globus_collection_error_message = null;
        draft.globus_collection_error_detail = null;
        draft.globus_collection_error_technical = null;
        if (draft.remember_target_endpoint) {
          draft.saved_target_endpoint_id = endpointId;
          draft.saved_target_endpoint_label = endpointLabel;
        }
      })
    })
    .addCase(globus_actions.TOGGLE_REMEMBER_TARGET_ENDPOINT, (state, action) => {
      return produce(state, draft => {
        draft.remember_target_endpoint = !draft.remember_target_endpoint;
        if (draft.remember_target_endpoint) {
          draft.saved_target_endpoint_id = draft.target_endpoint_id || '';
          draft.saved_target_endpoint_label = draft.target_endpoint_label || '';
        } else {
          draft.saved_target_endpoint_id = '';
          draft.saved_target_endpoint_label = '';
        }
      })
    })
    .addCase(globus_actions.SET_GLOBUS_COLLECTION_PATH, (state, action) => {
      return produce(state, draft => {
        draft.collection_path = action.payload;
      })
    })
    .addCase(globus_actions.SET_GLOBUS_SOURCE_ENDPOINT, (state, action) => {
      return produce(state, draft => {
        draft.source_endpoint = action.payload;
      })
    })
    .addCase(globus_actions.TOGGLE_UPLOAD_TO_GLOBUS, (state, action) => {
      return produce(state, draft => {
        draft.upload = !draft.upload;
      })
    })
    .addCase(globus_actions.TOGGLE_DELETE_AFTER_GLOBUS_UPLOAD, (state, action) => {
      return produce(state, draft => {
        draft.delete_after = !draft.delete_after;
      })
    })
    .addCase(globus_actions.SYNC_UPLOAD_PREFS_FROM_ROUTING, (state, action) => {
      return produce(state, draft => {
        const p = action.payload || {};
        draft.upload = !!p.upload;
        draft.delete_after = !!p.delete_after;
      })
    })
    .addCase(globus_actions.ADD_UPLOAD_FILE_TO_QUEUE, (state, action) => {
      return produce(state, draft => {
        draft.upload_queue.push(action.payload);
      })
    })
    .addCase(globus_actions.REMOVE_UPLOAD_FILE_FROM_QUEUE, (state, action) => {
      return produce(state, draft => {
        for (let idx in draft.upload_queue) {
          if (draft.upload_queue[idx].row_idx === action.payload) {
            draft.upload_queue.splice(idx, 1);
            break;
          }
        }
      })
    })
    .addCase(globus_actions.GLOBUS_ACQUIRE_UPLOAD_SLOT, (state) => {
      return produce(state, draft => {
        draft.upload_in_flight += 1;
      })
    })
    .addCase(globus_actions.GLOBUS_RELEASE_UPLOAD_SLOT, (state) => {
      return produce(state, draft => {
        draft.upload_in_flight = Math.max(0, draft.upload_in_flight - 1);
      })
    })
    .addCase(globus_actions.UPLOAD_FILE_COMPLETE, (state) => {
      return produce(state, draft => {
        draft.upload_in_flight = Math.max(0, draft.upload_in_flight - 1);
      })
    })
    .addCase(globus_actions.UPLOAD_FILE_FAILURE, (state) => {
      return produce(state, draft => {
        draft.upload_in_flight = Math.max(0, draft.upload_in_flight - 1);
      })
    })
    .addCase(globus_actions.GLOBUS_UPLOAD_COORDINATOR_TICK, (state) => state)
    .addCase(globus_actions.GLOBUS_COLLECTION_EXISTS, (state, action) => {
      return produce(state, draft => {
        draft.globus_collection_exists = true;
        draft.globus_collection_error_message = null;
        draft.globus_collection_error_detail = null;
        draft.globus_collection_error_technical = null;
      })
    })
    .addCase(globus_actions.GLOBUS_COLLECTION_DOES_NOT_EXIST, (state, action) => {
      return produce(state, draft => {
        draft.globus_collection_exists = false;
        const p = action.payload;
        if (p && typeof p === 'object' && !Array.isArray(p)) {
          draft.globus_collection_error_message =
            p.userMessage != null ? String(p.userMessage) : String(p.message || 'Path could not be accessed.');
          draft.globus_collection_error_detail =
            p.userDetail != null && String(p.userDetail).trim() ? String(p.userDetail) : null;
          draft.globus_collection_error_technical =
            p.technical != null && String(p.technical).trim() ? String(p.technical) : null;
        } else {
          draft.globus_collection_error_message =
            typeof p === 'string' ? p : 'Path could not be accessed.';
          draft.globus_collection_error_detail = null;
          draft.globus_collection_error_technical = null;
        }
      })
    })
    .addCase(globus_actions.CHECK_CLI_AVAILABLE, (state, action) => {
      return produce(state, draft => {
        draft.cli_available = action.payload;
      })
    })
    .addCase(globus_actions.SET_LOGIN_URL, (state, action) => {
      console.log('[Globus Reducer] SET_LOGIN_URL action received');
      console.log('[Globus Reducer] Current login_url:', state.login_url);
      console.log('[Globus Reducer] New login_url:', action.payload);
      return produce(state, draft => {
        draft.login_url = action.payload;
      })
    })
    .addCase(globus_actions.SET_ACCESS_CODE, (state, action) => {
      console.log('[Globus Reducer] SET_ACCESS_CODE action received');
      console.log('[Globus Reducer] Current access_code:', state.access_code);
      console.log('[Globus Reducer] New access_code:', action.payload);
      return produce(state, draft => {
        draft.access_code = action.payload;
      })
    })
    .addCase(globus_actions.SET_LOGIN_PENDING, (state, action) => {
      console.log('[Globus Reducer] SET_LOGIN_PENDING action received');
      console.log('[Globus Reducer] Current login_pending:', state.login_pending);
      console.log('[Globus Reducer] New login_pending:', action.payload);
      console.log('[Globus Reducer] Current state context:', {
        login_url: state.login_url,
        access_code: state.access_code,
        api_auth: state.api_auth
      });
      return produce(state, draft => {
        draft.login_pending = action.payload;
      })
    })
    .addCase(globus_actions.SET_AUTH_CHECK_PENDING, (state, action) => {
      return produce(state, draft => {
        draft.auth_check_pending = action.payload;
        if (action.payload) {
          draft.login_error = false;
          draft.login_error_message = null;
        }
      })
    })
    .addCase(globus_actions.CLEAR_LOGIN_INFO, (state, action) => {
      return produce(state, draft => {
        draft.login_url = null;
        draft.access_code = null;
        draft.login_pending = false;
        draft.auth_check_pending = false;
        draft.authorization_code_input = '';
      })
    })
    .addCase(globus_actions.SET_AUTHORIZATION_CODE_INPUT, (state, action) => {
      return produce(state, draft => {
        draft.authorization_code_input = action.payload;
      })
    })
    .addCase(globus_actions.TOGGLE_SSL_VERIFICATION, (state, action) => {
      return produce(state, draft => {
        draft.disable_ssl_verification = !draft.disable_ssl_verification;
      })
    })
    .addCase(globus_actions.SET_DISABLE_SSL_VERIFICATION, (state, action) => {
      return produce(state, draft => {
        draft.disable_ssl_verification = Boolean(action.payload);
      });
    })
    .addCase(globus_actions.SET_GLOBUS_ENDPOINT_PICKER_MODE, (state, action) => {
      return produce(state, draft => {
        const mode = action.payload === 'durable' ? 'durable' : 'session';
        draft.endpoint_picker_mode = mode;
      });
    })
})

export default globus_reducer;
