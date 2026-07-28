import { take, put, select, call } from 'redux-saga/effects';

import * as app_actions from '../../actions/app';
import * as config_profiles_actions from '../../actions/configProfiles';
import set_store from './set_store';
import { buildPersistedStore } from '../../helpers/persisted_store';
import { resetLoadSavedStoreDedup } from './load_saved_store';
import { ensureDisclaimerPrompt } from '../../helpers/ensure_disclaimer_prompt.js';

function* watch_delete_store() {
  while (true) {
    yield take(app_actions.DELETE_STORE);
    yield put({ type: app_actions.RESET_STORE });
    yield electronAPI.deleteStore();
  }
}

function* watch_restore_defaults() {
  while (true) {
    yield take(app_actions.RESTORE_DEFAULTS);
    yield put({ type: app_actions.RESET_STORE });
    const store = yield select();
    yield set_store(buildPersistedStore(store));
    resetLoadSavedStoreDedup();

    // Keep the profile library; clear active markers only.
    try {
      const profiles = yield call(electronAPI.getConfigProfiles);
      const doc = {
        schemaVersion: 1,
        activeProfileId: null,
        activeFingerprint: null,
        profiles: Array.isArray(profiles?.profiles) ? profiles.profiles : [],
      };
      yield call(electronAPI.setConfigProfiles, doc);
      yield put({ type: config_profiles_actions.HYDRATE_CONFIG_PROFILES, payload: doc });
    } catch (err) {
      console.error('Failed to clear active config profile after restore defaults', err);
    }

    yield* ensureDisclaimerPrompt();
  }
}

export { watch_restore_defaults };
export default watch_delete_store;
