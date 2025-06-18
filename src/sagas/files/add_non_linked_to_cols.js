import { put, select } from 'redux-saga/effects';

import * as files_actions from "../../actions/files";

export default function* add_non_linked_to_cols(headers) {
  let linked_headers = [];
  const {reserved_path_column, reserved_rename_column, reserved_destination_directory_column} = yield select(state => state.files.csv);

  if (reserved_path_column) {
    linked_headers.push(reserved_path_column.header);
  }
  if (reserved_rename_column) {
    linked_headers.push(reserved_rename_column.header);
  }
  if (reserved_destination_directory_column) {
    linked_headers.push(reserved_destination_directory_column.header);
  }
  


  for (const header_idx in headers) {
    let header = headers[header_idx];
    if (!linked_headers.includes(header) && !header.startsWith('__reserved')) {
      yield put({type: files_actions.ADD_FILE_COL, payload: {field: header}});
    }
  }
}