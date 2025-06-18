import { take, put, fork } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';

import {return_base_dir_from_source, return_file_extension_from_source} from '../../helpers/renderer_path_helpers';

import add_csv from './add_csv';
import add_excel from "./add_excel";

export default function* select_import_csv_xlsx() {
  while(true) {
    const action = yield take(files_actions.SELECT_IMPORT_CSV_XSLX);
    yield put({type: files_actions.DISABLE_CHANGES});
    const file_or_files = yield electronAPI.openFileSingleDialog();
    try {
      if (file_or_files) {
        const file = file_or_files[0];
        const ext = return_file_extension_from_source(file);
        const dir = return_base_dir_from_source(file);
        yield put({type: files_actions.SET_CSV_FILE, payload: file});
        if (ext === "csv") {
          yield fork(add_csv, file);
        }
        else if (ext === "xlsx") {
          yield add_excel(file);
        } else if (ext === null) {
          console.log("No file selected.");
        }
        else {
          console.log("File type not supported.");
        }
        // yield update_input_dir(dir);
      }
    } catch (err) {
      console.log(`Could not add selected csv directory ${file_or_files} with error ${err}`)
    }

    yield put({type: files_actions.ENABLE_CHANGES});
  }
}