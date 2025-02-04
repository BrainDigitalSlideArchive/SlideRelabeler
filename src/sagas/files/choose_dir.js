import { take, put} from 'redux-saga/effects';

import * as files_actions from '../../actions/files';

export default function* choose_dir (choose_action, set_action) {
  while(true) {
    yield take(choose_action);
    const folder_result = yield electronAPI.openFolderDialog();
    if (folder_result && typeof(folder_result) === "string" || !'error' in folder_result) {
      yield put({type: set_action, payload: folder_result});
    } else {
      console.log("No folder selected.");
    }
  }
}