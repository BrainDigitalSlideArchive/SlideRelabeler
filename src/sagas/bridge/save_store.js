import {select, take} from 'redux-saga/effects';

import get_backend_debug_messages from '../debug/get_backend_debug_messages';
import get_backend_error_messages from '../debug/get_backend_error_messages';

import set_store from './set_store';

import * as files_actions from '../../actions/files';
import * as app_actions from '../../actions/app';
import * as config_actions from '../../actions/config';
import * as esm_actions from '../../actions/esm';
import * as dsa_actions from '../../actions/dsa';
import * as globus_actions from '../../actions/globus';
import * as upload_routing_actions from '../../actions/uploadRouting';
import * as auditLog_actions from '../../actions/auditLog';
import { initialSessionMetrics } from '../../reducers/files/default_state';
import { makeEmptySearchFeedback } from '../../helpers/esm_search_feedback';

const globus_actions_for_save = Object.values(globus_actions).filter(
  (a) => a !== globus_actions.GLOBUS_UPLOAD_COORDINATOR_TICK
);

let actions_to_save = [
  ...Object.values(files_actions),
  ...Object.values(config_actions),
  ...Object.values(esm_actions),
  ...Object.values(dsa_actions),
  ...globus_actions_for_save,
  ...Object.values(upload_routing_actions),
  ...Object.values(auditLog_actions),
]

function* watch_save_store() {
  while(true) {
    const action = yield take(actions_to_save);
    const store = yield select();
    
    // Filter out passwords AND all authentication/session state before saving
    // Only persist connection config and user preferences
    const storeToSave = {
      ...store,
      esm: store.esm ? {
        integrationEnabled: store.esm.integrationEnabled,
        rememberUsername: store.esm.rememberUsername,
        username: store.esm.rememberUsername ? store.esm.username : '',
        profiles: store.esm.profiles,
        activeProfileId: store.esm.activeProfileId,
        authenticated: false,
        authToken: null,
        loading: false,
        error: false,
        errorMessage: null,
        searchLoading: false,
        searchFeedback: makeEmptySearchFeedback(),
        results: [],
        slidesByAccession: {},
        selectedIds: [],
      } : store.esm,
      dsa: store.dsa ? {
        api_url: store.dsa.api_url,
        username: store.dsa.username,
        // password: NOT persisted
        folder_id: store.dsa.folder_id,
        upload: store.dsa.upload,
        delete_after: store.dsa.delete_after,
        upload_throttle_limit: store.dsa.upload_throttle_limit,
        // Clear all auth/session state:
        api_auth: null,
        login_error: false,
        login_error_message: null,
        upload_queue: [],
        dsa_folder_exists: null,
        dsa_folder_error_message: null,
      } : store.dsa,
      uploadRouting: store.uploadRouting ? {
        auto_upload: store.uploadRouting.auto_upload,
        delete_local_after: store.uploadRouting.delete_local_after,
        max_local_pending: store.uploadRouting.max_local_pending,
        max_globus_parallel_uploads: store.uploadRouting.max_globus_parallel_uploads,
        destination: store.uploadRouting.destination,
      } : store.uploadRouting,
      globus: store.globus ? {
        disable_ssl_verification: store.globus.disable_ssl_verification,
        collection_name: store.globus.collection_name,
        target_endpoint_id: store.globus.target_endpoint_id,
        target_endpoint_label: store.globus.target_endpoint_label,
        remember_target_endpoint: store.globus.remember_target_endpoint,
        saved_target_endpoint_id: store.globus.saved_target_endpoint_id,
        saved_target_endpoint_label: store.globus.saved_target_endpoint_label,
        collection_path: store.globus.collection_path,
        source_endpoint: store.globus.source_endpoint,
        upload: store.globus.upload,
        delete_after: store.globus.delete_after,
        api_auth: null,
        login_error: false,
        login_error_message: null,
        login_url: null,
        access_code: null,
        login_pending: false,
        auth_check_pending: false,
        authorization_code_input: '',
        upload_queue: [],
        globus_collection_exists: null,
        globus_collection_error_message: null,
        globus_collection_error_detail: null,
        globus_collection_error_technical: null,
        cli_available: store.globus.cli_available,
        username: store.globus.username,
      } : store.globus,
      files: store.files
        ? { ...store.files, session_metrics: { ...initialSessionMetrics } }
        : store.files,
      auditLog: store.auditLog ?? undefined,
    };
    
    const response = yield set_store(storeToSave);

    // Setup debug messages for continuous updates if needed
    const debug_config = yield select(state => state.config.debug);

    if (debug_config.enable_debug) {
      yield get_backend_debug_messages();
    }
    yield get_backend_error_messages();
  }
}

export default watch_save_store;