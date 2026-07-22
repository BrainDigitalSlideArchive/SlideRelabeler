import { take, put, select } from 'redux-saga/effects';

import * as app_actions from '../../actions/app';
import set_store from './set_store';
import { buildPersistedStore } from '../../helpers/persisted_store';
import { resetLoadSavedStoreDedup } from './load_saved_store';

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
  }
}

export { watch_restore_defaults };
export default watch_delete_store;
