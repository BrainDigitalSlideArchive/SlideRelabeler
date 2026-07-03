import { put, select } from 'redux-saga/effects';

import * as files_actions from "../../actions/files";
import { isHiddenFileTableColumn } from "../../helpers/file_table_columns.js";

export default function* add_non_linked_to_cols(headers) {
  let linked_headers = [];
  const {
    reserved_path_column,
    reserved_rename_column,
    reserved_destination_directory_column,
    reserved_label_column,
    reserved_qr_column,
  } = yield select(state => state.files.csv);

  for (const col of [
    reserved_path_column,
    reserved_rename_column,
    reserved_destination_directory_column,
    reserved_label_column,
    reserved_qr_column,
  ]) {
    if (col?.header) linked_headers.push(col.header);
  }


  for (const header_idx in headers) {
    let header = headers[header_idx];
    if (!linked_headers.includes(header) && !header.startsWith('__reserved') && !isHiddenFileTableColumn(header)) {
      yield put({type: files_actions.ADD_FILE_COL, payload: {field: header}});
    }
  }
}