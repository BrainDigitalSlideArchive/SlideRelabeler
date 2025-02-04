import { take, put, fork } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';
import {return_filename_basename_from_filename} from "../../helpers/renderer_path_helpers";
import get_uuid from "./get_uuid";

export default function* add_folders() {
  while(true) {
    const action = yield take(files_actions.ADD_FOLDERS);
    yield put({type: files_actions.DISABLE_CHANGES});
    const folders = yield electronAPI.openFoldersDialog();
    for (let folder_idx in folders) {
      let folder = folders[folder_idx];
      try {
        let files = yield electronAPI.getAllWSIFilePaths(folder);
        for (let file_idx in files) {
          let file = files[file_idx];
          let metadata = yield electronAPI.getMetadata(file.source.path);
          const basename = return_filename_basename_from_filename(file.source.filename);
          const file_uuid = yield get_uuid(file);
          yield put({type: files_actions.ADD_FILE_ROW, payload: Object.assign({}, file, metadata, {rename: basename, uuid: file_uuid})});
        }
      }
      catch (err) {
        console.log(`Unable to load folder ${folder} with error ${err}`);
      }
      yield put({type: files_actions.ENABLE_CHANGES});

    }
  }
}