import { fork, take, cancel, call, select, takeEvery } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';

import load_saved_store, { resetLoadSavedStoreDedup } from '../bridge/load_saved_store';
import watch_preview_metadata from './watch_preview_metadata';
import { logViewerDebug } from '../../helpers/viewer_debug';

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

function* logViewerStoreState(label) {
  const file_rows_count = yield select((state) => state.files?.file_rows?.length ?? 0);
  logViewerDebug(label, { file_rows_count });
}

function* sagas() {
  console.log('Starting viewer sagas');
  resetLoadSavedStoreDedup();

  const store_updated_watcher = yield fork(watch_store_updated);

  // Hydrate from disk before React mounts so Viewer has file_rows on first paint.
  yield call(load_saved_store);
  yield call(logViewerStoreState, 'viewerSagaInitialLoad');

  yield takeEvery(app_actions.START_VIEWER, function* onStartViewer() {
    yield call(load_saved_store);
    yield call(logViewerStoreState, 'startViewerComplete');
  });

  const watch_preview_metadata_watcher = yield fork(watch_preview_metadata);

  yield take(app_actions.STOP_VIEWER);
  yield cancel(store_updated_watcher);
  yield cancel(watch_preview_metadata_watcher);
}

export default sagas;
