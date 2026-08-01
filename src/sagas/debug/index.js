import { take, fork, cancel } from 'redux-saga/effects';

import * as debug_actions from "../../actions/debug";

import watch_export_debug_json from "./watch_export_debug_json";
import clear_backend_error_messages from "./clear_backend_error_messages";
import clear_backend_debug_messages from "./clear_backend_debug_messages";
import watchDiagnosticsEnableAndDrain from "./watch_diagnostics_enable";
import watchFrontendErrorsForDiagnostics from "./watch_frontend_errors_for_diagnostics";
import {
  watchClearDiagnosticsLog,
  watchDrainDiagnosticsEngine,
} from "./watch_diagnostics_log_actions";

export function* debug_saga () {
  while(true) {
    yield take(debug_actions.START_DEBUG_SAGA);
    const watch_clear_backend_error_messages = yield fork(clear_backend_error_messages);
    const watch_clear_backend_debug_messages = yield fork(clear_backend_debug_messages);
    const watch_export = yield fork(watch_export_debug_json);
    const watch_enable = yield fork(watchDiagnosticsEnableAndDrain);
    const watch_fe_errors = yield fork(watchFrontendErrorsForDiagnostics);
    const watch_clear_diag = yield fork(watchClearDiagnosticsLog);
    const watch_drain = yield fork(watchDrainDiagnosticsEngine);

    yield take(debug_actions.STOP_DEBUG_SAGA);
    yield cancel(watch_clear_backend_error_messages);
    yield cancel(watch_clear_backend_debug_messages);
    yield cancel(watch_export);
    yield cancel(watch_enable);
    yield cancel(watch_fe_errors);
    yield cancel(watch_clear_diag);
    yield cancel(watch_drain);
  }
}

export default debug_saga;
