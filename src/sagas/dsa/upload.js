import { take, put, fork } from 'redux-saga/effects';

import * as dsa_actions from '../../actions/dsa';
import * as files_actions from '../../actions/files';

function* watch_complete_upload() {
    while (true) {
        const action = yield take(files_actions.UPLOAD_FILE_COMPLETE);
        // Stop listening for complete upload and file progress on completion of file upload
        yield electronAPI.dsaStopUploadComplete();
        yield electronAPI.dsaStopUploadFileProgress();
        yield electronAPI.dsaStopUploadFileError();
    }
}

function* watch_upload() {
    while (true) {
        // payload should be the file row
        const action = yield take(dsa_actions.UPLOAD_FILE);
        const {folder_id, file} = action.payload;
        // Setup listeners for file progress and complete upload dsa channels
        let progress_listener = yield electronAPI.dsaSetupUploadFileProgress(window.redux_store.dispatch);
        let complete_update_listener = yield electronAPI.dsaSetupUploadComplete(window.redux_store.dispatch);
        if (file && file.__reserved && file.__reserved.source && file.__reserved.source.path) {
            // Start watching for complete file upload to stop listening for file progress and complete upload
            yield fork(watch_complete_upload);
            const upload_response = yield electronAPI.dsaUploadFileStart(folder_id, file.__reserved.source.path, file.__reserved.uuid);
            console.log("Upload response", upload_response);
            if (upload_response[0]) {
                const upload_id = upload_response[1]._id;
                yield put({type: files_actions.UPLOAD_FILE_STARTED, payload: {file: file, upload_id: upload_id}});
            } else {
                yield put({type: files_actions.UPLOAD_FILE_ERROR, payload: {file: file, error: upload_response[1].message}});
            }
        }
    }
}

export default watch_upload;