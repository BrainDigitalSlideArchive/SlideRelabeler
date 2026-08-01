import { take, put, fork, call } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';

import {return_base_dir_from_source, return_file_extension_from_source} from '../../helpers/renderer_path_helpers';

import add_csv from './add_csv';
import add_excel from "./add_excel";


export default function* select_import_csv_xlsx() {
  while(true) {
    yield take(files_actions.SELECT_IMPORT_CSV_XSLX);
    yield put({type: files_actions.DISABLE_CHANGES});
    try {
      const file_or_files = yield call([electronAPI, electronAPI.openFileSingleDialog]);
      if (file_or_files) {
        const file = file_or_files[0];
        const ext = return_file_extension_from_source(file);
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
      }
    } catch (err) {
      console.error('[select_import_csv_xlsx] dialog/import failed', err);
    } finally {
      yield put({type: files_actions.ENABLE_CHANGES});
    }
  }
}
