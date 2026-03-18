import {select, take} from 'redux-saga/effects';

import get_backend_debug_messages from '../debug/get_backend_debug_messages';
import get_backend_error_messages from '../debug/get_backend_error_messages';

import set_store from './set_store';

import * as files_actions from '../../actions/files';
import * as app_actions from '../../actions/app';
import * as config_actions from '../../actions/config';
import * as esm_actions from '../../actions/esm';
import * as dsa_actions from '../../actions/dsa';

let actions_to_save = [
  ...Object.values(files_actions),
  ...Object.values(config_actions),
  ...Object.values(esm_actions),
  ...Object.values(dsa_actions),
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
        url: store.esm.url,
        username: store.esm.username,
        // password: NOT persisted
        mappingConfig: store.esm.mappingConfig,
        transformRules: store.esm.transformRules,
        selectedTransformRuleIds: store.esm.selectedTransformRuleIds,
        // Clear all auth/session state:
        authenticated: false,
        authToken: null,
        loading: false,
        error: false,
        errorMessage: null,
        searchLoading: false,
        searchError: false,
        searchErrorMessage: null,
        results: [],
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