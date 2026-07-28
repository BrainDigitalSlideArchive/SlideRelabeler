import { put, select } from 'redux-saga/effects';

import * as modal_actions from '../actions/modal.js';
import { needsDisclaimerPrompt } from './disclaimer.js';

/**
 * Push disclaimer modal if the current config still requires agreement.
 */
export function* ensureDisclaimerPrompt() {
  const disclaimer = yield select((s) => s.config?.disclaimer);
  if (!needsDisclaimerPrompt(disclaimer)) return;
  yield put({
    type: modal_actions.PUSH_MODAL_IF_ABSENT,
    payload: { type: 'disclaimer' },
  });
}
