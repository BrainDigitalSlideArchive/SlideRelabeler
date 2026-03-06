import { fork, put, cancel, select, call } from 'redux-saga/effects';
import { join_paths } from '../../helpers/renderer_path_helpers';

import monitor_process_progress from "./monitor_process_progress";
import output_csv from "./output_csv";

import * as files_actions from '../../actions/files';
import * as dsa_actions from '../../actions/dsa';
import { structToObject } from '../../helpers/grpc_helpers';

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
    let output_dir = yield select(state => state.files.output_dir);
    const monitor_progress = yield fork(monitor_process_progress, file_row_idx, info, output_path);

    yield put({ type: files_actions.ADD_PROCESSING_FILE, payload: { file_row_idx, output_path } });

    let enable_copy_mode = yield select(state => state.config.copy.enable_copy_mode);

    // process file
    const processed_file = yield call(electronAPI.processFile, info);
    let processed_file_object = yield structToObject(processed_file);
    let processed_file_json = JSON.parse(processed_file_object.value);
    

    // get metadata from output file 
    let encoded = encodeURIComponent(output_path);
    let response = yield fetch(`metadata://${encoded}`);
    let response_json = yield response.json();
    response_json.metadata = yield structToObject(response_json.metadata);

    // Update associated images
    processed_file_json.associatedImages = response_json.associatedImages;

    yield put({ type: files_actions.PROCESSED_FILE, payload: { row_idx: file_row_idx, processedFile: processed_file_json } });
    yield cancel(monitor_progress);
    yield put({ type: files_actions.REMOVE_PROCESSING_FILE, payload: file_row_idx });
    const folder_id = yield select(state => state.dsa.folder_id);
    const upload_to_dsa = yield select(state => state.dsa.upload);
    const api_auth = yield select(state => state.dsa.api_auth);
    if (upload_to_dsa && api_auth.authToken) {
      yield put({ type: dsa_actions.UPLOAD_FILE, payload: { row_idx: file_row_idx, folder_id: folder_id, file_path: output_path, file: processed_file } });
    }

    yield call(save_csv);
  } catch (error) {
    let message = "Error processing file. Please check the path to the file and verify you have the correct permissions for reading the file and writing the file to desired output directory."
    yield put({ type: files_actions.UPDATE_FILE_ROW_WITH_ERROR, payload: { file_row_idx, error: message } })
    yield put({ type: files_actions.ADD_BACKEND_ERROR_MESSAGE, payload: { message: `Error processing file. ${message}. ${error.message}` } });

    yield call(save_csv);
  }
}