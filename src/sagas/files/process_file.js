import { fork, put, cancel, select } from 'redux-saga/effects';
import * as files_actions from '../../actions/files';

import monitor_process_progress from "./monitor_process_progress";

export default function* process_file(fileRow) {
  const monitor_progress = yield fork(monitor_process_progress, fileRow);
  const config = yield select(state => state.config);
  const info = {
    config: config,
    ...fileRow
  };
  const processedFile = yield electronAPI.processFile(info);
  yield put({type: files_actions.PROCESSED_FILE, payload: {processedFile: JSON.parse(processedFile), path: fileRow.source.path}});
  yield cancel(monitor_progress);
}