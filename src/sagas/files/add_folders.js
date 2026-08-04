import { take, put, fork, call } from 'redux-saga/effects';
import { make_file_row } from './add_file';

import * as debug_actions from '../../actions/debug';
import * as files_actions from '../../actions/files';

export function* add_folders_worker(folders) {
  try {
    let addedAny = false;
    for (let folder_idx in folders) {
      let folder = folders[folder_idx];
      try {
        let file_rows = [];
        let files = yield call([electronAPI, electronAPI.getAllWSIFilePaths], folder);
        for (let file_idx in files) {
          let file_row = yield make_file_row(files[file_idx]);
          file_rows.push(file_row);
        }
        if (file_rows.length > 0) {
          yield put({ type: files_actions.ADD_FILE_ROWS, payload: file_rows });
          addedAny = true;
        }
      } catch (err) {
        console.log(`Unable to load folder ${folder} with error ${err}`);
      }
    }
    if (addedAny) {
      yield put({ type: files_actions.UPDATE_FILES_WITHOUT_METADATA });
    }
  } catch (err) {
    yield put({
      type: debug_actions.ADD_FRONTEND_ERROR_MESSAGE,
      payload: { message: `Error adding folders. ${err.message}` },
    });
  }
}

export default function* add_folders() {
  while (true) {
    yield take(files_actions.ADD_FOLDERS);
    yield put({ type: files_actions.DISABLE_CHANGES });
    try {
      const folders = yield call([electronAPI, electronAPI.openFoldersDialog]);

      if (Array.isArray(folders) && folders.length > 0) {
        yield fork(add_folders_worker, folders);
        yield put({ type: files_actions.SET_CSV_NEEDS_OUTPUT_DIR, payload: true });
      }
    } catch (err) {
      console.error('[add_folders] openFoldersDialog failed', err);
    } finally {
      yield put({ type: files_actions.ENABLE_CHANGES });
    }
  }
}
