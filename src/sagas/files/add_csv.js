import { put, call, select, take } from 'redux-saga/effects';

import * as files_actions from "../../actions/files";
import * as debug_actions from "../../actions/debug";
import * as config_actions from "../../actions/config";
import * as modal_actions from "../../actions/modal";

import {setup_row_data} from "../../helpers/data_helpers";

import link_headers_to_reserved from "./link_headers_to_reserved";
import add_non_linked_to_cols from "./add_non_linked_to_cols";
import setup_csv_row from "./setup_csv_row";

// todo: Make test cases for different CSV input files when data is missing.

export function* watch_add_csv() {
  while (true) {
    const action = yield take(files_actions.ADD_CSV);
    yield call(add_csv, action.payload);
  }
}

export default function* add_csv(file) {
  try {
    yield put({type: files_actions.SET_CSV_NEEDS_OUTPUT_DIR, payload: false});
    yield put({type: files_actions.SET_CSV_FILE_PATH, payload: file.source.path});
    const read_result = yield electronAPI.readCSV(file.source.path);
    yield put({type: files_actions.ADD_CSV_HEADERS, payload: {headers: read_result.headers}});

    // Get the headers and link them to columns if applicable
    let links_result = yield link_headers_to_reserved(read_result.headers);
    if (!links_result) {
      return;
    }

    // Add remaining not linked headers to cols
    yield add_non_linked_to_cols(read_result.headers);

    let added_files_count = 0;

    let output_rows = [];

    // Add data from rows to the state
    for (const row_idx in read_result.data) {
      let csv_row = read_result.data[row_idx];

      let output_row = yield setup_csv_row(read_result.headers, csv_row);

      if (output_row.__reserved && output_row.__reserved.source) {
        added_files_count += 1;
        output_rows.push(output_row);
      }
    }

    if (output_rows.length > 0) {
      yield put({type: files_actions.ADD_FILE_ROWS, payload: output_rows});
      yield put({type: files_actions.UPDATE_FILES_WITHOUT_METADATA});
    }

    let file_rows = yield select(state => state.files.file_rows);

    let destination_dir_count = 0;

    for (let file_row_idx in file_rows) {
      let file_row = file_rows[file_row_idx];
      if (file_row.__reserved.destinationDirectory) {
        destination_dir_count += 1;
      }
    }

    if (destination_dir_count === added_files_count) {
      yield put({type: files_actions.SET_CSV_NEEDS_OUTPUT_DIR, payload: false})
      yield put({type: files_actions.SET_CSV_NEEDS_CSV_OUTPUT_DIR, payload: true})
    } else {
      yield put({type: files_actions.SET_CSV_NEEDS_OUTPUT_DIR, payload: true})
      yield put({type: files_actions.SET_CSV_NEEDS_CSV_OUTPUT_DIR, payload: false})
    }

  } catch (error) {
    yield put({type: debug_actions.ADD_FRONTEND_ERROR_MESSAGE, payload: `Error adding CSV file. ${error.message}`});
    yield put({type: modal_actions.DISPLAY_ERROR_MESSAGE, payload: `Error while attempting to process CSV file. ${error.message}`});
  }
}