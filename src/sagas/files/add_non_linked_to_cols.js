import { put } from 'redux-saga/effects';

import * as files_actions from "../../actions/files";

export default function* add_non_linked_to_cols(headers, header_links) {
  for (const header_idx in headers) {
    let header = headers[header_idx];
    if (!Object.keys(header_links).includes(header)) {
      yield put({type: files_actions.ADD_FILE_COL, payload: {field: header}});
    }
  }
}