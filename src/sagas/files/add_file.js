import {put, select} from 'redux-saga/effects';
import get_uuid from "./get_uuid";
import * as files_actions from "../../actions/files";
import {
  applyRowNamingDefaults,
  initRowNamingSources,
} from '../../helpers/row_naming_defaults.js';

export function* make_file_row(file) {
  const output_dir = yield select(state => state.files.output_dir);

  let metadata = Object.assign({}, file, { destinationDirectory: output_dir });

  // make reserved
  let file_row = {
    '__reserved': metadata
  }

  file_row.__reserved.uuid = yield get_uuid(file_row.__reserved.source.path);

  const config = yield select(state => state.config);
  const file_cols = yield select(state => state.files.file_cols);
  const enrichedConfig = { ...config, fileCols: file_cols };
  file_row = initRowNamingSources(file_row);
  file_row = applyRowNamingDefaults(file_row, enrichedConfig);

  return file_row;
}

function* add_file(file) {
  let file_row = yield make_file_row(file);

  yield put({type: files_actions.ADD_FILE_ROW, payload: file_row});
  yield put({type: files_actions.UPDATE_FILES_WITHOUT_METADATA});
  yield put({type: files_actions.SET_CSV_NEEDS_OUTPUT_DIR, payload: true})
}

export default add_file;