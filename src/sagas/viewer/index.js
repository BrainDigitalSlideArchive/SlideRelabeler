import { fork, take, cancel } from 'redux-saga/effects';

import load_saved_store from '../bridge/load_saved_store';
import update_store from '../bridge/update_store';
import constant_update_store from '../bridge/constant_update_store';

import * as app_actions from '../../actions/app';

function* sagas() {
  console.log("Starting viewer sagas");
  yield take(app_actions.START_VIEWER);
  yield load_saved_store();
  const update_store_watcher = yield fork(update_store);
  const constant_update_store_watcher = yield fork(constant_update_store);

  yield take(app_actions.STOP_VIEWER);
  yield cancel(update_store_watcher);
  yield cancel(constant_update_store_watcher);
};

export default sagas;