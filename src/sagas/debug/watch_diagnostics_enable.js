import { cancel, delay, fork, select, take } from 'redux-saga/effects';

import * as config_actions from '../../actions/config';

import drainDiagnosticsEngine from './drain_diagnostics_engine';

const DRAIN_INTERVAL_MS = 5000;

function* appendBanner(line) {
  if (typeof electronAPI === 'undefined' || !electronAPI.appendDiagnosticsLogLines) return;
  try {
    yield electronAPI.appendDiagnosticsLogLines([line]);
  } catch (err) {
    console.error('[diagnostics] banner failed', err);
  }
}

function* diagnosticsDrainLoop() {
  while (true) {
    const enabled = yield select((state) => !!state.config?.debug?.enable_debug);
    if (!enabled) return;
    yield drainDiagnosticsEngine({ force: false });
    yield delay(DRAIN_INTERVAL_MS);
  }
}

function* watchDiagnosticsEnableAndDrain() {
  let drainTask = null;
  let wasEnabled = yield select((state) => !!state.config?.debug?.enable_debug);

  if (wasEnabled) {
    yield appendBanner(`--- diagnostics session started ${new Date().toISOString()} ---`);
    drainTask = yield fork(diagnosticsDrainLoop);
  }

  while (true) {
    const action = yield take([
      config_actions.TOGGLE_ENABLE_DEBUG,
      config_actions.UPDATE_CONFIG,
    ]);
    const enabled = yield select((state) => !!state.config?.debug?.enable_debug);
    const fromToggle = action.type === config_actions.TOGGLE_ENABLE_DEBUG;

    if (enabled && !wasEnabled) {
      if (fromToggle) {
        yield appendBanner(`--- diagnostics enabled ${new Date().toISOString()} ---`);
      } else {
        yield appendBanner(`--- diagnostics session started ${new Date().toISOString()} ---`);
      }
      if (drainTask) {
        yield cancel(drainTask);
      }
      drainTask = yield fork(diagnosticsDrainLoop);
    } else if (!enabled && wasEnabled) {
      if (drainTask) {
        yield cancel(drainTask);
        drainTask = null;
      }
      yield drainDiagnosticsEngine({ force: true });
      if (fromToggle) {
        yield appendBanner(`--- diagnostics disabled ${new Date().toISOString()} ---`);
      }
    }

    wasEnabled = enabled;
  }
}

export default watchDiagnosticsEnableAndDrain;
