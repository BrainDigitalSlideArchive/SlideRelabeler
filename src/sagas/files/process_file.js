import { fork, put, cancel, select, call } from 'redux-saga/effects';
import { join_paths } from '../../helpers/renderer_path_helpers';

import monitor_process_progress from "./monitor_process_progress";
import output_csv from "./output_csv";

import * as files_actions from '../../actions/files';

export function* save_csv() {
  // Make new CSV file if save_csv is true
  const save_csv = yield select(state => state.config.csv.save_csv);

  if (save_csv) {
    let output_path;

    const output_dir = yield select(state => state.files.output_dir);
    const csv_output_dir = yield select(state => state.files.csv.output_dir);

    if (output_dir) {
      output_path = join_paths([output_dir, 'deid_output.csv']);
    } else if (csv_output_dir) {
      output_path = join_paths([csv_output_dir, 'deid_output.csv']);
    }

    yield output_csv(output_path);
  }
}

export default function* process_file(file_row_idx, file_row) {
  try {
    const config = yield select(state => state.config);

    let info = {
      config: config,
      ...file_row
    };

    let output_path = yield call(electronAPI.getOutputPath, info);

    yield put({type: files_actions.ADD_PROCESSING_FILE, payload: {file_row_idx, output_path}});

    const monitor_progress = yield fork(monitor_process_progress, file_row_idx, info, output_path);
    console.log('info', info);
    const processedFile = yield call(electronAPI.processFile, info);

    yield put({type: files_actions.PROCESSED_FILE, payload: {row_idx: file_row_idx, processedFile: JSON.parse(processedFile)}});
    yield cancel(monitor_progress);
    yield put({type: files_actions.REMOVE_PROCESSING_FILE, payload: file_row_idx});

    yield call(save_csv);
  } catch (error) {
    let message = "Error processing file. Please check the path to the file and verify you have the correct permissions for reading the file and writing the file to desired output directory."
    yield put({type: files_actions.UPDATE_FILE_ROW_WITH_ERROR, payload: {file_row_idx, error: message}})
    yield put({type: files_actions.ADD_BACKEND_ERROR_MESSAGE, payload: {message: `Error processing file. ${message}. ${error.message}`}});

    yield call(save_csv);
  }
}