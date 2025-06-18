import { take, put, fork } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';
import {make_file_row} from './add_file';

export function* add_files_worker(file_or_files) {
  console.log("Start add files worker", file_or_files);
  try {
    let file_rows = [];

    for (const file_idx in file_or_files) {
      let file = file_or_files[file_idx];
      let file_row = yield make_file_row(file);
      file_rows.push(file_row);
    }

    yield put({type: files_actions.ADD_FILE_ROWS, payload: file_rows});
  }
  catch (err) {
    put({type: debug_actions.ADD_FRONTEND_ERROR_MESSAGE, payload: {message: `Error adding files. ${err.message}`}});
  }
}

export default function* add_files() {
  while(true) {
    const action = yield take(files_actions.ADD_FILES);
    yield put({type: files_actions.DISABLE_CHANGES});
    const file_or_files = yield electronAPI.openFileMultiDialog();

    if (file_or_files) {
      yield fork(add_files_worker, file_or_files);
    }
    yield put({type: files_actions.SET_CSV_NEEDS_OUTPUT_DIR, payload: true})
    yield put({type: files_actions.UPDATE_FILES_WITHOUT_METADATA});

    yield put({type: files_actions.ENABLE_CHANGES});
  }
}