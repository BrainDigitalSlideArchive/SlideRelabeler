import { call, select } from 'redux-saga/effects';

import { drainEngineToDiagnosticsLog } from '../../helpers/diagnostics_drain.js';

/**
 * Pull engine debug/error rings into diagnostics.log, then clear the rings.
 * When force is false, no-op unless recording is enabled.
 */
export function* drainDiagnosticsEngine({ force = false } = {}) {
  const enabled = yield select((state) => !!state.config?.debug?.enable_debug);
  if (!enabled && !force) return;

  try {
    yield call(drainEngineToDiagnosticsLog);
  } catch (err) {
    console.error('[diagnostics] engine drain failed', err);
  }
}

export default drainDiagnosticsEngine;
