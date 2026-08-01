import { take, put, fork, cancel, call } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';
import { make_file_row } from './add_file';

function* add_files_loop(file_or_files) {
  for (const file_idx in file_or_files) {
    let file = file_or_files[file_idx];
    let file_row = yield make_file_row(file);
    yield put({ type: files_actions.ADD_FILE_ROW, payload: file_row });
  }
  yield put({ type: files_actions.UPDATE_FILES_WITHOUT_METADATA });
}

export function* cancel_add_files_loop(add_files_loop_task) {
  yield take(files_actions.CLEAR_FILES);
  yield cancel(add_files_loop_task);
}

export function* add_files_worker(file_or_files) {
  console.log("Start add files worker", file_or_files);
  try {
    let file_rows = [];

    let add_files_loop_task = yield fork(add_files_loop, file_or_files);

    yield fork(cancel_add_files_loop, add_files_loop_task);

  }
  catch (err) {
    put({ type: debug_actions.ADD_FRONTEND_ERROR_MESSAGE, payload: { message: `Error adding files. ${err.message}` } });
  }
}

export default function* add_files() {
  while (true) {
    yield take(files_actions.ADD_FILES);
    yield put({ type: files_actions.DISABLE_CHANGES });
    try {
      const file_or_files = yield call([electronAPI, electronAPI.openFileMultiDialog]);

      if (file_or_files) {
        yield fork(add_files_worker, file_or_files);
      }
      yield put({ type: files_actions.SET_CSV_NEEDS_OUTPUT_DIR, payload: true });
    } catch (err) {
      console.error('[add_files] openFileMultiDialog failed', err);
    } finally {
      yield put({ type: files_actions.ENABLE_CHANGES });
    }
  }
}
