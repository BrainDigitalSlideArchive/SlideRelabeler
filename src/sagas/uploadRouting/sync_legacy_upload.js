import { select, takeEvery, put } from 'redux-saga/effects';

import * as app_actions from '../../actions/app';
import * as dsa_actions from '../../actions/dsa';
import * as globus_actions from '../../actions/globus';
import * as upload_routing_actions from '../../actions/uploadRouting';

const triggerActions = [
  upload_routing_actions.RESTORE_UPLOAD_ROUTING,
  upload_routing_actions.SET_AUTO_UPLOAD,
  upload_routing_actions.TOGGLE_AUTO_UPLOAD,
  upload_routing_actions.SET_KEEP_LOCAL_COPY,
  upload_routing_actions.TOGGLE_KEEP_LOCAL_COPY,
  upload_routing_actions.SET_MAX_LOCAL_PENDING,
  upload_routing_actions.SET_UPLOAD_DESTINATION,
  upload_routing_actions.SET_AUTO_UPLOAD_MODE,
  app_actions.RESET_STORE,
];

function deleteAfterUpload(ur) {
  return !!(ur.auto_upload && !ur.keep_local_copy);
}

function* syncLegacyFlags() {
  const ur = yield select((s) => s.uploadRouting);
  const dsaUpload = !!(ur.auto_upload && ur.destination === 'dsa');
  const globUpload = !!(ur.auto_upload && ur.destination === 'globus');
  const deleteAfter = deleteAfterUpload(ur);
  yield put({
    type: dsa_actions.UPDATE_DSA,
    payload: {
      upload: dsaUpload,
      delete_after: dsaUpload && deleteAfter,
      upload_throttle_limit: ur.max_local_pending,
    },
  });
  yield put({
    type: globus_actions.SYNC_UPLOAD_PREFS_FROM_ROUTING,
    payload: {
      upload: globUpload,
      delete_after: globUpload && deleteAfter,
    },
  });
}

export default function* watchSyncLegacyUpload() {
  yield takeEvery(triggerActions, syncLegacyFlags);
}
