import { put, call, select } from 'redux-saga/effects';

import * as files_actions from "../../actions/files";

import {setup_row_data} from "../../helpers/data_helpers";

import link_headers_to_cols from "./link_headers_to_cols";
import add_non_linked_to_cols from "./add_non_linked_to_cols";
import add_metadata_to_row from "./add_metadata_to_row";

// todo: Make test cases for different CSV input files when data is missing.

export default function* add_csv(file) {
  yield put({type: files_actions.SET_CSV_FILE_PATH, payload: {file_path: file.source.path}});
  const read_result = yield electronAPI.readCSV(file.source.path);
  yield put({type: files_actions.ADD_CSV_HEADERS, payload: {headers: read_result.headers}});
  const file_cols = yield select(state => state.files.fileCols);

  // Get the headers and link them to their respective file columns if applicable
  yield link_headers_to_cols(read_result.headers, file_cols, files_actions.LINK_CSV_HEADER);

  // Use select to get the linked headers stored in the state
  const header_links = yield select(state => state.files.csv.header_cols_link);

  // Add remaining not linked headers to cols
  yield add_non_linked_to_cols(read_result.headers, header_links);

  // Add data from rows to the state
  for (const row_idx in read_result.data) {
    let row = {}

    let data_row = read_result.data[row_idx];

    row = setup_row_data(row, data_row, read_result.headers, header_links);

    let final_row = Object.assign({}, row);

    yield put({type: files_actions.ADD_FILE_ROW, payload: final_row});
  }
}