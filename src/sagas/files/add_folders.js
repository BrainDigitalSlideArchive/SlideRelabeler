import { take, put, fork } from 'redux-saga/effects';
import {make_file_row} from './add_file';

import * as debug_actions from '../../actions/debug';
import * as files_actions from '../../actions/files';

export function* add_folders_worker(folders) {
  try {
    for (let folder_idx in folders) {
      let folder = folders[folder_idx];
      try {
        let file_rows = [];
        let files = yield electronAPI.getAllWSIFilePaths(folder);
        for (let file_idx in files) {
          let file_row = yield make_file_row(files[file_idx]);
          file_rows.push(file_row);
        }
        yield put({type: files_actions.ADD_FILE_ROWS, payload: file_rows});
      }
      catch (err) {
        console.log(`Unable to load folder ${folder} with error ${err}`);
      }
    }
  }
  catch (err) {
    put({type: debug_actions.ADD_FRONTEND_ERROR_MESSAGE, payload: {message: `Error adding folders. ${err.message}`}});
  }
}

export default function* add_folders() {
  while(true) {
    const action = yield take(files_actions.ADD_FOLDERS);
    yield put({type: files_actions.DISABLE_CHANGES});
    const folders = yield electronAPI.openFoldersDialog();

    if (folders) {
      yield fork(add_folders_worker, folders);
    }
    yield put({type: files_actions.SET_CSV_NEEDS_OUTPUT_DIR, payload: true})
    yield put({type: files_actions.UPDATE_FILES_WITHOUT_METADATA});

    yield put({type: files_actions.ENABLE_CHANGES});
  }
}