import { select, take, put, call, fork, delay, join } from 'redux-saga/effects';

import * as dsa_actions from '../../actions/dsa';
import * as files_actions from '../../actions/files';
import { isDsaItemMetadataEnabled } from '../../helpers/dsa_upload_metadata.js';
import { isDsaUploadRoutingActive } from '../../helpers/upload_activity.js';
import { syncDerivedUploading } from '../upload_activity.js';

function toGridRowIndex(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
}

/**
 * Wait for success or failure for this row (mirrors Globus watch_complete_upload).
 * Without ERROR, join() hangs forever after a failed /completion and blocks the queue.
 */
function* watch_complete_upload(row_idx) {
    const want = toGridRowIndex(row_idx);
    while (true) {
        const action = yield take((a) => {
            if (a.type === dsa_actions.UPLOAD_FILE_COMPLETE) {
                const p = a.payload;
                const ri = typeof p === 'object' && p != null ? p.row_idx : p;
                return toGridRowIndex(ri) === want;
            }
            if (a.type === files_actions.UPLOAD_FILE_ERROR) {
                const p = a.payload;
                const ri = p && typeof p === 'object' ? p.row_idx : null;
                return ri != null && toGridRowIndex(ri) === want;
            }
            return false;
        });

        yield electronAPI.dsaStopUploadComplete();
        yield electronAPI.dsaStopUploadFileProgress();
        yield electronAPI.dsaStopUploadFileError();

        if (action.type === files_actions.UPLOAD_FILE_ERROR) {
            break;
        }

        const payload = action.payload;
        const config = yield select((state) => state.config);
        const file_rows = yield select((state) => state.files.file_rows);
        const file_row = file_rows[row_idx];
        const itemId = typeof payload === 'object' ? payload.itemId : null;
        const fileName = typeof payload === 'object' ? payload.fileName : null;

        const dsaUpload = config?.dsa_upload || {};
        const setMetadata = isDsaItemMetadataEnabled(dsaUpload.itemMetadata);
        if (itemId && file_row && (dsaUpload.rename_item_after_upload || setMetadata)) {
            const enrichResult = yield call(electronAPI.dsaEnrichUploadedItem, {
                itemId,
                fileRow: file_row,
                options: {
                    renameItem: !!dsaUpload.rename_item_after_upload,
                    setMetadata,
                    itemMetadata: dsaUpload.itemMetadata,
                    csvConfig: config?.csv,
                    fileName,
                },
            });
            if (enrichResult && enrichResult[0]) {
                yield put({
                    type: files_actions.UPDATE_FILE_ROW_NAMING,
                    payload: {
                        row_idx,
                        file_row: {
                            ...file_row,
                            __reserved: {
                                ...file_row.__reserved,
                                dsa_item_id: itemId,
                            },
                        },
                    },
                });
            } else if (enrichResult && enrichResult[1]) {
                yield put({
                    type: files_actions.UPDATE_FILE_ROW_NAMING,
                    payload: {
                        row_idx,
                        file_row: {
                            ...file_row,
                            __reserved: {
                                ...file_row.__reserved,
                                dsa_enrich_error: enrichResult[1].message || 'DSA enrich failed',
                            },
                        },
                    },
                });
            }
        }

        yield put({ type: files_actions.UPLOAD_FILE_FINALIZE, payload: { row_idx: row_idx } });

        let delete_after = yield select(state => state.dsa.delete_after);
        if (delete_after) {
            const file_path = file_rows[row_idx].__reserved.output_path;
            yield electronAPI.deleteFile(file_path.replace(/\\/g, '/'));
            yield put({ type: files_actions.UPLOAD_DELETE_AFTER, payload: { row_idx: row_idx } });
        }
        break;
    }
}

function* watch_upload() {
    yield fork(upload_queue)
    while (true) {
        const action = yield take(dsa_actions.UPLOAD_FILE);
        yield put({ type: dsa_actions.ADD_UPLOAD_FILE_TO_QUEUE, payload: action.payload })
    }
}

function* upload_queue() {
    while (true) {
        const uploadRouting = yield select((state) => state.uploadRouting);
        if (!isDsaUploadRoutingActive(uploadRouting)) {
            yield call(syncDerivedUploading);
            yield delay(1000);
            continue;
        }

        const queue = yield select((state) => state.dsa.upload_queue);
        if (queue.length > 0) {
            yield call(syncDerivedUploading);
            const upload_payload = queue[0];
            const completeTask = yield fork(watch_complete_upload, upload_payload.row_idx);
            yield call(upload_file, upload_payload);
            yield join(completeTask);
            yield put({ type: dsa_actions.REMOVE_UPLOAD_FILE_FROM_QUEUE, payload: upload_payload.row_idx });
            yield call(syncDerivedUploading);
        } else {
            yield call(syncDerivedUploading);
        }
        yield delay(1000);
    }
}

function* upload_file(payload) {
    const { folder_id, row_idx, file_path, file } = payload;
    yield electronAPI.dsaSetupUploadFileProgress(window.redux_store.dispatch);
    yield electronAPI.dsaSetupUploadComplete(window.redux_store.dispatch);
    yield electronAPI.dsaSetupUploadFileError(window.redux_store.dispatch);
    // Allow row_idx === 0 (same as Globus).
    if (!(file && row_idx != null && file_path)) {
        yield put({
            type: files_actions.UPLOAD_FILE_ERROR,
            payload: { row_idx, error: 'Invalid file or path for DSA upload.', file_path },
        });
        return;
    }
    yield put({
        type: files_actions.UPLOAD_FILE_STARTED,
        payload: { row_idx, indeterminate: false },
    });
    yield electronAPI.dsaUploadFile(folder_id, row_idx, file_path);
}

export default watch_upload;
