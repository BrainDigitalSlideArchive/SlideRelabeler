import { select, take, put, call, fork, delay } from 'redux-saga/effects';

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
    yield put({ type: dsa_actions.SET_UPLOADING, payload: false })

    let delete_after = yield select(state => state.dsa.delete_after);
    if (delete_after) {
        const file_rows = yield select(state => state.files.file_rows);
        const file_path = file_rows[row_idx].__reserved.output_path;
        yield electronAPI.deleteFile(file_path.replace(/\\/g, '/'));
        yield put({ type: files_actions.UPLOAD_DELETE_AFTER, payload: { row_idx: row_idx } });
    }
}

function* watch_upload() {
    yield fork(upload_queue)
    while (true) {
        // payload should be the file row
        const action = yield take(dsa_actions.UPLOAD_FILE);
        yield put({ type: dsa_actions.SET_UPLOADING, payload: true })
        yield put({ type: dsa_actions.ADD_UPLOAD_FILE_TO_QUEUE, payload: action.payload })
    }
}

function* upload_queue() {
    while (true) {
        const queue = yield select(state => state.dsa.upload_queue);
        if (queue.length > 0) {
            const upload_payload = queue[0];
            yield fork(upload_file, upload_payload)
            yield take(dsa_actions.UPLOAD_FILE_COMPLETE);
            yield put({ type: dsa_actions.REMOVE_UPLOAD_FILE_FROM_QUEUE, payload: upload_payload.row_idx })
        }
        yield delay(1000);
    }
}

function* upload_file(payload) {
    const { folder_id, row_idx, file_path, file } = payload;
    // Setup listeners for file progress and complete upload dsa channels
    let progress_listener = yield electronAPI.dsaSetupUploadFileProgress(window.redux_store.dispatch);
    let complete_update_listener = yield electronAPI.dsaSetupUploadComplete(window.redux_store.dispatch);
    if (file && row_idx && file_path) {
        // Start watching for complete file upload to stop listening for file progress and complete upload
        yield fork(watch_complete_upload, row_idx);
        const upload_response = yield electronAPI.dsaUploadFile(folder_id, row_idx, file_path);
    }
}

export default watch_upload;