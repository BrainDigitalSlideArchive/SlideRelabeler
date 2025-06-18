import { take, put, delay } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';

export default function* monitor_process_progress(file_row_idx, info, output_path) {
  yield put({type: files_actions.CLEAR_PROGRESS});
  while(true) {
    try {
      const progress_info = yield electronAPI.getProgress(info, output_path);

      yield put({type: files_actions.UPDATE_FILE_PROGRESS, payload: { row_idx: file_row_idx, progress_info: progress_info}});

      yield delay(200);
    }
    catch (error) {
      console.error("Error getting progress", error);
    }
  }
}