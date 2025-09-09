import { take, put, fork } from 'redux-saga/effects';

import * as dsa_actions from '../../actions/dsa';
import * as files_actions from '../../actions/files';

function* watch_complete_upload(row_idx) {
    while (true) {
        const action = yield take(dsa_actions.UPLOAD_FILE_COMPLETE);
        // Stop listening for complete upload and file progress on completion of file upload
        yield electronAPI.dsaStopUploadComplete();
        yield electronAPI.dsaStopUploadFileProgress();
        yield electronAPI.dsaStopUploadFileError();

        break;
    }
    let action_finalize = yield put({ type: dsa_actions.UPLOAD_FILE_FINALIZE, payload: { row_idx: row_idx } });
}

function* watch_upload() {
    while (true) {
        // payload should be the file row
        const action = yield take(dsa_actions.UPLOAD_FILE);
        const { folder_id, row_idx, file, file_path } = action.payload;
        // Setup listeners for file progress and complete upload dsa channels
        let progress_listener = yield electronAPI.dsaSetupUploadFileProgress(window.redux_store.dispatch);
        let complete_update_listener = yield electronAPI.dsaSetupUploadComplete(window.redux_store.dispatch);
        if (file && row_idx && file_path) {
            // Start watching for complete file upload to stop listening for file progress and complete upload
            yield fork(watch_complete_upload, row_idx);
            const upload_response = yield electronAPI.dsaUploadFile(folder_id, row_idx, file_path);
        }
    }
}

export default watch_upload;