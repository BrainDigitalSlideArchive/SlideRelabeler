import { call, put, select, takeEvery } from 'redux-saga/effects';

import * as config_actions from '../../actions/config';
import * as globus_actions from '../../actions/globus';
import { resolveDefaultSessionHydration } from '../../helpers/default_session_hydration.js';
import { migrateGlobusUploadConfig } from '../../helpers/globus_upload_migration.js';

/**
 * After store hydrate: migrate config.globus_upload from legacy globus prefs,
 * then hydrate empty session fields from config defaults.
 */
export function* syncGlobusUploadAfterLoad() {
  const globusUpload = yield select((state) => state.config?.globus_upload);
  const globus = yield select((state) => state.globus);
  const migrated = migrateGlobusUploadConfig(globusUpload, globus);

  const needsConfigWrite =
    migrated.default_target_endpoint_id !== String(globusUpload?.default_target_endpoint_id || '').trim()
    || migrated.default_target_endpoint_label !== String(globusUpload?.default_target_endpoint_label || '').trim()
    || migrated.source_endpoint !== String(globusUpload?.source_endpoint || '').trim()
    || Boolean(migrated.disable_ssl_verification) !== Boolean(globusUpload?.disable_ssl_verification);

  if (needsConfigWrite || !globusUpload) {
    yield put({
      type: config_actions.SET_GLOBUS_UPLOAD_CONFIG,
      payload: migrated,
      meta: { skipSessionSync: true },
    });
  }

  const endpointHydration = resolveDefaultSessionHydration({
    defaultValue: migrated.default_target_endpoint_id,
    sessionValue: globus?.target_endpoint_id,
  });
  if (endpointHydration.hydrateSessionFromDefault) {
    yield put({
      type: globus_actions.SET_GLOBUS_TARGET_ENDPOINT,
      payload: {
        id: migrated.default_target_endpoint_id,
        label: migrated.default_target_endpoint_label || migrated.default_target_endpoint_id,
      },
    });
  }

  const sourceHydration = resolveDefaultSessionHydration({
    defaultValue: migrated.source_endpoint,
    sessionValue: globus?.source_endpoint,
  });
  if (sourceHydration.hydrateSessionFromDefault) {
    yield put({
      type: globus_actions.SET_GLOBUS_SOURCE_ENDPOINT,
      payload: migrated.source_endpoint,
    });
  }

  if (Boolean(globus?.disable_ssl_verification) !== Boolean(migrated.disable_ssl_verification)) {
    yield put({
      type: globus_actions.SET_DISABLE_SSL_VERIFICATION,
      payload: migrated.disable_ssl_verification,
    });
  }
}

function* onSetGlobusUploadConfig(action) {
  if (action.meta?.skipSessionSync) return;
  const p = action.payload || {};

  if (p.default_target_endpoint_id !== undefined) {
    const id = String(p.default_target_endpoint_id || '').trim();
    const label = String(
      p.default_target_endpoint_label !== undefined
        ? p.default_target_endpoint_label
        : (yield select((state) => state.config?.globus_upload?.default_target_endpoint_label)) || id,
    ).trim();
    yield put({
      type: globus_actions.SET_GLOBUS_TARGET_ENDPOINT,
      payload: { id, label: label || id },
    });
  }

  if (p.source_endpoint !== undefined) {
    yield put({
      type: globus_actions.SET_GLOBUS_SOURCE_ENDPOINT,
      payload: String(p.source_endpoint || '').trim(),
    });
  }

  if (p.disable_ssl_verification !== undefined) {
    const next = Boolean(p.disable_ssl_verification);
    yield put({ type: globus_actions.SET_DISABLE_SSL_VERIFICATION, payload: next });
    try {
      if (typeof window !== 'undefined' && window.electronAPI?.globusSetSslVerification) {
        yield call([window.electronAPI, window.electronAPI.globusSetSslVerification], next);
      }
    } catch (e) {
      // ignore bridge errors; Redux still updated
    }
  }
}

export function* watchGlobusUploadConfigSync() {
  yield takeEvery(config_actions.SET_GLOBUS_UPLOAD_CONFIG, onSetGlobusUploadConfig);
}
