import { fork, take, cancel, call, takeEvery } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';

import load_saved_store from '../bridge/load_saved_store';
import watch_preview_metadata from './watch_preview_metadata';

import * as app_actions from '../../actions/app';

function createStoreUpdatedChannel() {
  return eventChannel((emit) => {
    const unsub = electronAPI.onStoreUpdated(() => emit(true));
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  });
}

function* watch_store_updated() {
  const chan = createStoreUpdatedChannel();
  try {
    while (true) {
      yield take(chan);
      yield call(load_saved_store);
    }
  } finally {
    chan.close?.();
  }
}

function* sagas() {
  console.log("Starting viewer sagas");
  yield take(app_actions.START_VIEWER);
  yield load_saved_store();
  const store_updated_watcher = yield fork(watch_store_updated);
  const watch_preview_metadata_watcher = yield fork(watch_preview_metadata);

  yield take(app_actions.STOP_VIEWER);
  yield cancel(store_updated_watcher);
  yield cancel(watch_preview_metadata_watcher);
};

export default sagas;