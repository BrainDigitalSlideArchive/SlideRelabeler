import { select, take, put, fork, delay, call } from 'redux-saga/effects';

import * as globus_actions from '../../actions/globus';
import * as files_actions from '../../actions/files';
import { isGlobusEndpointUuid } from '../../helpers/globus_helpers';

function normalizeWindowsPathForGcp(rawPath) {
    if (rawPath == null) return '';
    const p = String(rawPath).trim();
    if (!p) return '';

    // UNC paths (\\server\share\...) are not reliably addressable by GCP path namespace.
    if (/^(\\\\|\/\/)/.test(p)) {
        return null;
    }

    // Convert to forward slashes for globus CLI usage.
    const slash = p.replace(/\\/g, '/');

    // Drive-letter absolute path: C:/Users/... -> /C/Users/...
    const m = /^([a-zA-Z]):\/(.*)$/.exec(slash);
    if (m) {
        const drive = m[1].toUpperCase();
        const rest = m[2];
        return `/${drive}/${rest}`.replace(/\/+/g, '/');
    }

    // Already looks like a GCP path (/C/Users/...) or relative path; return as-is.
    return slash;
}

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

    if (file && row_idx != null && file_path) {
        // Start watching for complete file upload to stop listening for file progress and complete upload
        yield fork(watch_complete_upload, row_idx);

        // Local endpoint ID only (Globus Connect Personal UUID); path is always this file's output_path
        const state_source_endpoint = yield select(state => state.globus.source_endpoint);
        const local_endpoint_id = (source_endpoint || state_source_endpoint || '').trim();
        if (!local_endpoint_id) {
            yield put({
                type: globus_actions.UPLOAD_FILE_FAILURE,
                payload: {
                    row_idx: row_idx,
                    message: 'Local endpoint ID not configured. Set your Globus Connect Personal endpoint ID in Network -> Globus.'
                }
            });
            return;
        }
        if (!isGlobusEndpointUuid(local_endpoint_id)) {
            yield put({
                type: globus_actions.UPLOAD_FILE_FAILURE,
                payload: {
                    row_idx: row_idx,
                    message:
                        'Local endpoint ID must be a Globus endpoint UUID (not a display name). Use “Use this computer’s GCP ID” in Network → Globus or run: globus endpoint local-id',
                },
            });
            return;
        }
        const normalizedLocalPath = normalizeWindowsPathForGcp(file_path || '');
        if (normalizedLocalPath == null) {
            yield put({
                type: globus_actions.UPLOAD_FILE_FAILURE,
                payload: {
                    row_idx,
                    message:
                        'Local source path is a UNC/network path (e.g. \\\\server\\share\\...). Globus Connect Personal typically cannot address UNC paths directly. Copy outputs to a local drive (e.g. C:\\\\...) or configure a Globus Connect Server collection for the network share.',
                },
            });
            return;
        }
        const source_path = local_endpoint_id + ':' + normalizedLocalPath;
        const baseName = (file_path || '').split(/[/\\]/).pop() || 'file';
        const dest_dir = (collection_path || '').replace(/\/$/, '');
        const dest_path = dest_dir ? dest_dir + '/' + baseName : baseName;

        const file_size_bytes = file?.__reserved?.bytes ?? null;
        if (electronAPI.globusUploadFileWithSize) {
            const upload_response = yield call(
                electronAPI.globusUploadFileWithSize,
                source_path,
                dest_path,
                file_path,
                row_idx,
                file_size_bytes
            );
            if (!upload_response || !upload_response[0]) {
                yield put({ 
                    type: globus_actions.UPLOAD_FILE_FAILURE, 
                    payload: { 
                        row_idx: row_idx, 
                        message: upload_response[1]?.message || 'Failed to initiate transfer' 
                    } 
                });
            }
            return;
        }

        const upload_response = yield call(electronAPI.globusUploadFile, source_path, dest_path, file_path, row_idx);
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
