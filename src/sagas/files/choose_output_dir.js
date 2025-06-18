import { take, put} from 'redux-saga/effects';

import * as files_actions from '../../actions/files';

import choose_dir from './choose_dir';

export default function* choose_output_dir () {
  while(true) {
    const action = yield take(files_actions.CHOOSE_OUTPUT_DIR);
    yield put({type: files_actions.DISABLE_CHANGES});
    const folder = yield electronAPI.openFolderDialog();
    if (folder && typeof(folder) === "string" || !'error' in folder) {
      yield put({type: files_actions.SET_OUTPUT_DIR, payload: folder});
    } else {
      console.log("No folder selected.");
    }
    yield put({type: files_actions.ENABLE_CHANGES});
  }
}