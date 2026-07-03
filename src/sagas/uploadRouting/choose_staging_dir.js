import { select, take, put, call } from 'redux-saga/effects';

import * as upload_routing_actions from '../../actions/uploadRouting';

function isValidFolder(folder) {
  return folder && typeof folder === 'string';
}

export default function* choose_staging_dir() {
  while (true) {
    yield take(upload_routing_actions.CHOOSE_STAGING_DIR);
    try {
      const folder = yield call(electronAPI.openFolderDialog);
      if (!isValidFolder(folder)) {
        continue;
      }
      yield put({
        type: upload_routing_actions.SET_STAGING_DIR_MODE,
        payload: 'custom',
      });
      yield put({
        type: upload_routing_actions.SET_STAGING_DIR_CUSTOM,
        payload: folder,
      });
    } catch (err) {
      console.log('Error choosing staging directory', err);
    }
  }
}
