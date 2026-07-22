import { put, select, takeEvery } from 'redux-saga/effects';

import * as config_actions from '../../actions/config';
import * as dsa_actions from '../../actions/dsa';
import { resolveDsaUrlHydration } from '../../helpers/dsa_default_url.js';

/**
 * After store hydrate: migrate default ← session, or session ← default.
 */
export function* syncDsaUrlsAfterLoad() {
  const dsaUpload = yield select((state) => state.config?.dsa_upload);
  const dsa = yield select((state) => state.dsa);
  const {
    defaultApiUrl,
    sessionApiUrl,
    migrateDefaultFromSession,
    hydrateSessionFromDefault,
  } = resolveDsaUrlHydration(dsaUpload, dsa);

  if (migrateDefaultFromSession) {
    yield put({
      type: config_actions.SET_DSA_UPLOAD_CONFIG,
      payload: { default_api_url: sessionApiUrl },
      meta: { skipSessionUrlSync: true },
    });
  } else if (hydrateSessionFromDefault) {
    yield put({ type: dsa_actions.SET_DSA_API_URL, payload: defaultApiUrl });
  }
}

/**
 * When Configuration default URL changes, mirror into session effective URL.
 */
function* onSetDsaUploadConfig(action) {
  if (action.meta?.skipSessionUrlSync) return;
  const nextDefault = action.payload?.default_api_url;
  if (nextDefault === undefined) return;
  const trimmed = String(nextDefault || '').trim();
  yield put({ type: dsa_actions.SET_DSA_API_URL, payload: trimmed });
}

export function* watchDsaDefaultUrlSync() {
  yield takeEvery(config_actions.SET_DSA_UPLOAD_CONFIG, onSetDsaUploadConfig);
}
