import { take, put, select, call, fork, cancel, delay } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';
import * as debug_actions from '../../actions/debug';

import process_file, { save_csv } from './process_file';
import { join_paths, return_filename_dir_from_path} from "../../helpers/renderer_path_helpers";

function* watch_cancel_process_files(process_files_task) {
  yield take(files_actions.CANCEL_PROCESS_FILES);
  yield call(electronAPI.cancelRestartBridge);
  yield put({type: files_actions.CLEAR_PROGRESS});
  yield delay(2000);
  const processing_files = yield select(state => state.files.processing_files);
  for (let idx in processing_files) {
    let {file_row_idx, output_path} = processing_files[idx];
    let delete_result = yield call(electronAPI.deletePartialFile, output_path + '.partial');
    if (delete_result !== true) {
      yield put({type: debug_actions.ADD_BACKEND_ERROR_MESSAGE, payload: {message: "Error deleting partial file", error: delete_result}});
    }
    yield put({type: files_actions.RESET_FILE_ROW_PROGRESS, payload: file_row_idx});
  }
  yield put({type: files_actions.CLEAR_PROCESSING_FILES});
  yield cancel(process_files_task);
  yield put({type: files_actions.NOT_PROCESSING});
}

function* process_files_worker() {
  let run_process_files = true;
  while(run_process_files) {
    const output_dir = yield select(state => state.files.output_dir);
    const file_rows = yield select(state => state.files.file_rows);

    let processed_files_count = 0;
    let metadata_pending_count = 0;
    let error_files_count = 0;

    for (let file_row_idx in file_rows) {
      try {
        let file_row = file_rows[file_row_idx];
        if (file_row.__reserved.processed !== 1 && !file_row.__reserved.error && file_row.__reserved.bytes) {
          let result = yield call(process_file, file_row_idx, file_row);
          processed_files_count += 1;
        } else if (file_row.__reserved.processed !== 1 && !file_row.__reserved.error && !file_row.__reserved.bytes) {
          metadata_pending_count += 1;
        } else if (file_row.__reserved.processed !== 1 && file_row.__reserved.error ) {
          error_files_count += 1;
          yield call(save_csv);
        } else if (file_row.__reserved.processed === 1) {
          processed_files_count += 1;
        }
        } catch (err) {
          console.log('Error processing file', err);
      }
      
    }

    if (metadata_pending_count === 0 && (error_files_count + processed_files_count) === file_rows.length) {
      run_process_files = false;
    }
  }
  yield put({type: files_actions.NOT_PROCESSING});
}

function* cancel_cancel_watch_during_processing(watch_cancel_process_files_task) {
  let run_cancel_watch = true;

  while(run_cancel_watch) {
    const processing_files = yield select(state => state.files.processing_files);
    const processing = yield select(state => state.files.processing);
    if (!processing && !processing_files.length == 0) {
      yield cancel(watch_cancel_process_files_task);
      run_cancel_watch = false;
    }
    yield delay(1000);
  }
  yield put({type: files_actions.NOT_PROCESSING})
}

export default function* process_files() {
  while(true) {
    const action = yield take(files_actions.PROCESS_FILES);
    yield put({type: files_actions.TOGGLE_PROCESSING});
    const process_files_worker_task = yield fork(process_files_worker);
    const watch_cancel_process_files_task = yield fork(watch_cancel_process_files, process_files_worker_task);
    
    const cancel_cancel_watch_during_processing_task = yield fork(cancel_cancel_watch_during_processing, watch_cancel_process_files_task);
  }
}