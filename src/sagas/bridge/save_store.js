import {select, take} from 'redux-saga/effects';

import get_backend_debug_messages from '../debug/get_backend_debug_messages';
import get_backend_error_messages from '../debug/get_backend_error_messages';

import set_store from './set_store';

function* save_store() {
  while(true) {
    const action = yield take('*');
    const store = yield select();
    const response = yield set_store(store);

    // Setup debug messages for continuous updates if needed
    const debug_config = yield select(state => state.config.debug);

    if (debug_config.enable_debug) {
      yield get_backend_debug_messages();
    }
    yield get_backend_error_messages();
  }
}

export default save_store;