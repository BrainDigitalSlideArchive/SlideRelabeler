import { put, select } from "redux-saga/effects";
import add_metadata_to_row from "./add_metadata_to_row";
import * as files_actions from "../../actions/files";
import {return_if_path_absolute, return_if_path_relative, return_filename_dir_from_path, join_paths} from "../../helpers/renderer_path_helpers";

export default function* update_input_dir(input_dir) {
  const fileRows = yield select(state => state.files.fileRows);

  for (const row_idx in fileRows) {
    let file_dir = null;
    let row = Object.assign({}, fileRows[row_idx]);
    if (row.source.filename && return_if_path_absolute(row.source.filename) || return_if_path_relative(row.source.filename)) {
      const file_info = return_filename_dir_from_path(row.source.filename)
      row = Object.assign(row, {source: Object.assign({}, row.source, file_info)});
    } else if (row.source.directory && (return_if_path_absolute(row.source.directory) || return_if_path_relative(row.source.directory))) {
      if (return_if_path_relative(row.source.directory)) {
        file_dir = join_paths([input_dir, row.source.directory]);
      } else {
        file_dir = row.source.directory
      }
      row = Object.assign(row, {source: Object.assign({}, row.source, {directory: file_dir, path: join_paths([file_dir, row.source.filename])})})
    } else {
      file_dir = input_dir;
      row = Object.assign(row, {source: Object.assign({}, row.source, {directory: file_dir, path: join_paths([file_dir, row.source.filename])})});
    }

    try {
      row = yield add_metadata_to_row(row, file_dir);
    }
    catch (err) {
      console.log(`Failed to add metadata for row ${row} row with error ${err}`)
    }

    yield put({type: files_actions.UPDATE_FILE_ROW_WITH_METADATA, payload: {idx: row_idx, row: row}});
  }
}