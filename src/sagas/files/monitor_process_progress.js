import { take, put, delay } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';

export default function* monitor_process_progress(fileRow) {
  while(true) {
    const path = fileRow.source.path;
    yield delay(200);
    const api_result = yield electronAPI.getProgress(path);
    yield put({type: files_actions.UPDATE_FILE_PROGRESS, payload: { fileRow: fileRow, api_result: api_result}});
  }
}