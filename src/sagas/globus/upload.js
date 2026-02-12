import { select, take, put, fork, delay, call } from 'redux-saga/effects';

import * as globus_actions from '../../actions/globus';
import * as files_actions from '../../actions/files';

function* watch_complete_upload(row_idx) {
    while (true) {
        const action = yield take(globus_actions.UPLOAD_FILE_COMPLETE);
        // Stop listening for complete upload and file progress on completion of file upload
        yield call(electronAPI.globusStopUploadComplete);
        yield call(electronAPI.globusStopUploadFileProgress);
        yield call(electronAPI.globusStopUploadFileError);

        break;
    }
    let action_finalize = yield put({ type: globus_actions.UPLOAD_FILE_FINALIZE, payload: { row_idx: row_idx } });

    let delete_after = yield select(state => state.globus.delete_after);
    if (delete_after) {
        const file_rows = yield select(state => state.files.file_rows);
        const file_path = file_rows[row_idx].__reserved.output_path;
        yield call(electronAPI.deleteFile, file_path.replace(/\\/g, '/'));
        yield put({ type: files_actions.UPLOAD_DELETE_AFTER, payload: { row_idx: row_idx } });
    }
}

function* watch_upload() {
    yield fork(upload_queue)
    while (true) {
        // payload should be the file row
        const action = yield take(globus_actions.UPLOAD_FILE);
        yield put({ type: globus_actions.ADD_UPLOAD_FILE_TO_QUEUE, payload: action.payload })
    }
}

function* upload_queue() {
    while (true) {
        const queue = yield select(state => state.globus.upload_queue);
        if (queue.length > 0) {
            yield put({ type: files_actions.SET_UPLOADING, payload: true })
            const upload_payload = queue[0];
            yield fork(upload_file, upload_payload)
            yield take(globus_actions.UPLOAD_FILE_COMPLETE);
            yield put({ type: globus_actions.REMOVE_UPLOAD_FILE_FROM_QUEUE, payload: upload_payload.row_idx })
        }
        yield put({ type: files_actions.SET_UPLOADING, payload: false })
        yield delay(1000);
    }
}

function* upload_file(payload) {
    const { collection_path, row_idx, file_path, file, source_endpoint } = payload;
    // Setup listeners for file progress and complete upload globus channels
    yield call(electronAPI.globusSetupUploadFileProgress, window.redux_store.dispatch);
    yield call(electronAPI.globusSetupUploadComplete, window.redux_store.dispatch);
    yield call(electronAPI.globusSetupUploadFileError, window.redux_store.dispatch);
    
    if (file && row_idx && file_path) {
        // Start watching for complete file upload to stop listening for file progress and complete upload
        yield fork(watch_complete_upload, row_idx);
        
        // Construct source path - if source_endpoint provided, use it
        // Note: For local files, user needs Globus Connect Personal or a staging endpoint
        // The source_endpoint should be in format: endpoint-id:/path/to/file
        // If not provided, try to get from state or show error
        let source_path = source_endpoint;
        if (!source_path) {
            // Try to get source endpoint from state
            const state_source_endpoint = yield select(state => state.globus.source_endpoint);
            source_path = state_source_endpoint;
        }
        
        if (!source_path) {
            yield put({ 
                type: globus_actions.UPLOAD_FILE_FAILURE, 
                payload: { 
                    row_idx: row_idx, 
                    message: 'Source endpoint not configured. Please configure Globus Connect Personal or a source endpoint in settings.' 
                } 
            });
            return;
        }
        
        const upload_response = yield call(electronAPI.globusUploadFile, source_path, collection_path, file_path, row_idx);
        if (!upload_response || !upload_response[0]) {
            yield put({ 
                type: globus_actions.UPLOAD_FILE_FAILURE, 
                payload: { 
                    row_idx: row_idx, 
                    message: upload_response[1]?.message || 'Failed to initiate transfer' 
                } 
            });
        }
    }
}

export default watch_upload;
