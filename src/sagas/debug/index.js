import { take, fork, cancel } from 'redux-saga/effects';

import * as debug_actions from "../../actions/debug";

import watch_export_debug_json from "./watch_export_debug_json";
import clear_backend_error_messages from "./clear_backend_error_messages";
import clear_backend_debug_messages from "./clear_backend_debug_messages";

export function* debug_saga () {
  while(true) {
    // Start all async watchers
    yield take(debug_actions.START_DEBUG_SAGA);
    console.log("Starting debug saga");
    // const watch_get_backend_error_messages = yield fork(get_backend_error_messages);
    // const watch_get_backend_debug_messages = yield fork(get_backend_debug_messages);
    const watch_clear_backend_error_messages = yield fork(clear_backend_error_messages);
    const watch_clear_backend_debug_messages = yield fork(clear_backend_debug_messages);
    const watch_export = yield fork(watch_export_debug_json);

    // Stop all async watchers when the component is unmounted
    yield take(debug_actions.STOP_DEBUG_SAGA);
    // yield cancel(watch_get_backend_error_messages);
    // yield cancel(watch_get_backend_debug_messages);
    yield cancel(watch_clear_backend_error_messages);
    yield cancel(watch_clear_backend_debug_messages);
    yield cancel(watch_export);
  }
}

export default debug_saga;