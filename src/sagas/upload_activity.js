import { select, put } from 'redux-saga/effects';

import * as files_actions from '../actions/files';
import { computeWantUploading } from '../helpers/upload_activity.js';

/**
 * Derive files.uploading from DSA queue + Globus queue/in-flight.
 * Only destination that owns work should keep the flag; neither saga may clear it alone.
 */
export function* syncDerivedUploading() {
  const dsaQueueLen = yield select((state) => state.dsa.upload_queue?.length ?? 0);
  const globusQueueLen = yield select((state) => state.globus.upload_queue?.length ?? 0);
  const globusInFlight = yield select((state) => state.globus.upload_in_flight ?? 0);
  const cur = yield select((state) => state.files.uploading);
  const want = computeWantUploading({ dsaQueueLen, globusQueueLen, globusInFlight });
  if (Boolean(cur) !== want) {
    yield put({ type: files_actions.SET_UPLOADING, payload: want });
  }
}
