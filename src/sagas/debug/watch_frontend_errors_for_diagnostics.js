import { select, take } from 'redux-saga/effects';

import * as debug_actions from '../../actions/debug';
import { formatFrontendErrorForDiagnostics } from '../../helpers/diagnostics_log_format.js';

function* appendIfRecording(line) {
  const enabled = yield select((state) => !!state.config?.debug?.enable_debug);
  if (!enabled) return;
  if (typeof electronAPI === 'undefined' || !electronAPI.appendDiagnosticsLogLines) return;
  try {
    yield electronAPI.appendDiagnosticsLogLines([line]);
  } catch (err) {
    console.error('[diagnostics] append failed', err);
  }
}

function* watchFrontendErrorsForDiagnostics() {
  while (true) {
    const action = yield take([
      debug_actions.ADD_FRONTEND_ERROR_MESSAGE,
      debug_actions.ADD_BACKEND_ERROR_MESSAGE,
    ]);
    const kind = action.type === debug_actions.ADD_BACKEND_ERROR_MESSAGE
      ? 'backend'
      : 'frontend';
    const body = formatFrontendErrorForDiagnostics(action.payload).replace(/^frontend:\s*/, '');
    yield appendIfRecording(`${kind}: ${body}`);
  }
}

export default watchFrontendErrorsForDiagnostics;
