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
  ...Object.values(api_integrations_actions),
]

function* watch_save_store() {
  while(true) {
    yield take(actions_to_save);
    const store = yield select();
    yield set_store(buildPersistedStore(store));

    const debug_config = yield select(state => state.config.debug);

    if (debug_config.enable_debug) {
      yield get_backend_debug_messages();
    }
    yield get_backend_error_messages();
  }
}

export default watch_save_store;
