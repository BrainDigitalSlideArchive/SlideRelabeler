import {put, select} from 'redux-saga/effects';
import get_uuid from "./get_uuid";
import * as files_actions from "../../actions/files";
import {return_filename_basename_from_filename} from "../../helpers/renderer_path_helpers";

function* add_file(file) {
  let metadata = yield electronAPI.getMetadata(file.source.path);
  const basename = return_filename_basename_from_filename(file.source.filename);
  const file_uuid = yield get_uuid(file);
  const output_dir = yield select(state => state.files.output_dir);
  yield put({type: files_actions.ADD_FILE_ROW, payload: Object.assign({}, file, metadata, {rename: basename, uuid: file_uuid, destinationDirectory: output_dir})});
}

export default add_file;