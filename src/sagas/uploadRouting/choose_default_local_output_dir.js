import { take, put, call } from 'redux-saga/effects';

import * as upload_routing_actions from '../../actions/uploadRouting';

function isValidFolder(folder) {
  return folder && typeof folder === 'string';
}

export default function* choose_default_local_output_dir() {
  while (true) {
    yield take(upload_routing_actions.CHOOSE_DEFAULT_LOCAL_OUTPUT_DIR);
    try {
      const folder = yield call(electronAPI.openFolderDialog);
      if (!isValidFolder(folder)) {
        continue;
      }
      yield put({
        type: upload_routing_actions.SET_DEFAULT_LOCAL_OUTPUT_DIR,
        payload: folder,
      });
    } catch (err) {
      console.log('Error choosing default local output directory', err);
    }
  }
}
