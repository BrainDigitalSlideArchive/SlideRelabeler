import { take, put, select, call, fork, cancel } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';

import process_file from './process_file';
import output_csv from "./output_csv";
import { join_paths} from "../../helpers/renderer_path_helpers";

export default function* process_files() {
  while(true) {
    const action = yield take(files_actions.PROCESS_FILES);
    yield put({type: files_actions.TOGGLE_PROCESSING});
    const output_dir = yield select(state => state.files.output_dir);
    const fileRows = yield select(state => state.files.fileRows);
    for (let fileRowIdx in fileRows) {
      let fileRow = fileRows[fileRowIdx];
      yield process_file(fileRow);
    }
    yield put({type: files_actions.TOGGLE_PROCESSING});
    const output_path = join_paths([output_dir, 'deid_output.csv'])
    const save_csv = yield select(state => state.config.csv.save_csv);
    if (save_csv) {
      yield output_csv(output_path);
    }
  }
}