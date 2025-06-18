import {put, select} from 'redux-saga/effects';
import get_uuid from "./get_uuid";
import * as files_actions from "../../actions/files";
import {return_filename_basename_from_filename} from "../../helpers/renderer_path_helpers";

export function* make_file_row(file) {
  // let metadata = yield electronAPI.getMetadata(file.source.path);
  const basename = return_filename_basename_from_filename(file.source.filename);
  // const file_uuid = yield get_uuid(file);
  const output_dir = yield select(state => state.files.output_dir);

  let metadata = Object.assign({}, file, {rename: basename, destinationDirectory: output_dir});

  // make reserved
  let file_row = {
    '__reserved': metadata
  }

  file_row.__reserved.uuid = yield get_uuid(file_row.__reserved.source.path);

  return file_row;
}

function* add_file(file) {
  let file_row = yield make_file_row(file);

  yield put({type: files_actions.ADD_FILE_ROW, payload: file_row});
  yield put({type: files_actions.UPDATE_FILES_WITHOUT_METADATA});
  yield put({type: files_actions.SET_CSV_NEEDS_OUTPUT_DIR, payload: true})
}

export default add_file;