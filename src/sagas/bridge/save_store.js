import {select, take} from 'redux-saga/effects';

import get_backend_debug_messages from '../debug/get_backend_debug_messages';
import get_backend_error_messages from '../debug/get_backend_error_messages';

import set_store from './set_store';
import { buildPersistedStore } from '../../helpers/persisted_store';

import * as files_actions from '../../actions/files';
import * as config_actions from '../../actions/config';
import * as esm_actions from '../../actions/esm';
import * as dsa_actions from '../../actions/dsa';
import * as globus_actions from '../../actions/globus';
import * as upload_routing_actions from '../../actions/uploadRouting';
import * as auditLog_actions from '../../actions/auditLog';
import * as api_integrations_actions from '../../actions/apiIntegrations';

/** Ephemeral / UI-only files actions that should not trigger persistence. */
const FILES_ACTIONS_SKIP_SAVE = new Set([
  files_actions.START_FILES_SAGA,
  files_actions.STOP_FILES_SAGA,
  files_actions.ADD_FILES,
  files_actions.ADD_FOLDER,
  files_actions.ADD_FOLDERS,
  files_actions.CHOOSE_OUTPUT_DIR,
  files_actions.CHOOSE_INPUT_DIR,
  files_actions.OPEN_VIEWER,
  files_actions.GET_METADATA,
  files_actions.GET_COPY_PROGRESS,
  files_actions.PROCESS_FILE,
  files_actions.PROCESS_FILES,
  files_actions.CANCEL_PROCESS_FILES,
  files_actions.SELECT_IMPORT_CSV_XSLX,
  files_actions.ADD_CSV,
  files_actions.UPDATE_FILES_WITHOUT_METADATA,
  files_actions.DISABLE_CHANGES,
  files_actions.ENABLE_CHANGES,
  files_actions.UPDATE_FILE_PROGRESS,
  files_actions.CLEAR_PROGRESS,
  files_actions.RESET_FILE_ROW_PROGRESS,
  files_actions.UPDATE_FILE_UPLOAD_PROGRESS,
  files_actions.GLOBUS_UPLOAD_FILE_METRICS,
  files_actions.SET_METADATA_UPDATING,
  files_actions.ADD_TOTAL_BYTES,
  files_actions.REMOVE_TOTAL_BYTES,
  files_actions.TOGGLE_PROCESSING,
  files_actions.ADD_PROCESSING_FILE,
  files_actions.REMOVE_PROCESSING_FILE,
  files_actions.CLEAR_PROCESSING_FILES,
]);

const files_actions_for_save = Object.values(files_actions).filter(
  (a) => !FILES_ACTIONS_SKIP_SAVE.has(a),
);

const globus_actions_for_save = Object.values(globus_actions).filter(
  (a) => a !== globus_actions.GLOBUS_UPLOAD_COORDINATOR_TICK
);

let actions_to_save = [
  ...files_actions_for_save,
  ...Object.values(config_actions),
  ...Object.values(esm_actions),
  ...Object.values(dsa_actions),
  ...globus_actions_for_save,
  ...Object.values(upload_routing_actions),
  ...Object.values(auditLog_actions),
  ...Object.values(api_integrations_actions),
]

function* watch_save_store() {
  while(true) {
    yield take(actions_to_save);
    const store = yield select();
    try {
      yield set_store(buildPersistedStore(store));
    } catch (err) {
      console.error('[save_store] failed to persist store', err);
    }

    try {
      const debug_config = yield select(state => state.config.debug);

      if (debug_config.enable_debug) {
        yield get_backend_debug_messages();
      }
      yield get_backend_error_messages();
    } catch (err) {
      console.error('[save_store] failed to fetch backend messages', err);
    }
  }
}

export default watch_save_store;
