import { take, put, fork } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';
import get_uuid from './get_uuid';
import add_file from './add_file';

export default function* add_files() {
  while(true) {
    const action = yield take(files_actions.ADD_FILES);
    yield put({type: files_actions.DISABLE_CHANGES});
    const file_or_files = yield electronAPI.openFileMultiDialog();
    for (const file_idx in file_or_files) {
      let file = file_or_files[file_idx];
      yield add_file(file);
    }
    yield put({type: files_actions.ENABLE_CHANGES});
  }
}