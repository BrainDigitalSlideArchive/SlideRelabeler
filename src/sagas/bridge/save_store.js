import {select, take} from 'redux-saga/effects';

import get_backend_debug_messages from '../debug/get_backend_debug_messages';
import get_backend_error_messages from '../debug/get_backend_error_messages';

import set_store from './set_store';

import * as files_actions from '../../actions/files';
import * as app_actions from '../../actions/app';
import * as config_actions from '../../actions/config';

let actions_to_save = [
  ...Object.values(files_actions),
  ...Object.values(config_actions),
]

function* watch_save_store() {
  while(true) {
    const action = yield take(actions_to_save);
    const store = yield select();
    const response = yield set_store(store);

    console.log("window name", window.name);
    console.log("store", store);
    console.log("response", response);

    // Setup debug messages for continuous updates if needed
    const debug_config = yield select(state => state.config.debug);

    if (debug_config.enable_debug) {
      yield get_backend_debug_messages();
    }
    yield get_backend_error_messages();
  }
}

export default watch_save_store;