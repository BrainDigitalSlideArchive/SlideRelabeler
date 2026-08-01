import { take } from 'redux-saga/effects';

import * as debug_actions from '../../actions/debug';

import drainDiagnosticsEngine from './drain_diagnostics_engine';

function* watchClearDiagnosticsLog() {
  while (true) {
    yield take(debug_actions.CLEAR_DIAGNOSTICS_LOG);
    const api = typeof electronAPI !== 'undefined' ? electronAPI : null;
    try {
      if (api?.clearDiagnosticsLog) {
        yield api.clearDiagnosticsLog();
      }
      if (api?.clearDebugs) {
        yield api.clearDebugs();
      }
      if (api?.clearErrors) {
        yield api.clearErrors();
      }
    } catch (err) {
      console.error('[diagnostics] clear failed', err);
    }
  }
}

function* watchDrainDiagnosticsEngine() {
  while (true) {
    const action = yield take(debug_actions.DRAIN_DIAGNOSTICS_ENGINE);
    yield drainDiagnosticsEngine({ force: !!action.payload?.force });
  }
}

export { watchClearDiagnosticsLog, watchDrainDiagnosticsEngine };
