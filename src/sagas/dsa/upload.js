import { select, take, put, call, fork, delay, join } from 'redux-saga/effects';

import * as dsa_actions from '../../actions/dsa';
import * as files_actions from '../../actions/files';
import { isDsaItemMetadataEnabled } from '../../helpers/dsa_upload_metadata.js';

function* watch_complete_upload(row_idx) {
    while (true) {
        const action = yield take(dsa_actions.UPLOAD_FILE_COMPLETE);
        const payload = action.payload;
        const completedRowIdx = typeof payload === 'object' ? payload.row_idx : payload;
        if (completedRowIdx !== row_idx) {
            continue;
        }

        yield electronAPI.dsaStopUploadComplete();
        yield electronAPI.dsaStopUploadFileProgress();
        yield electronAPI.dsaStopUploadFileError();

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
        const queue = yield select(state => state.dsa.upload_queue);
        if (queue.length > 0) {
            const currentlyUploading = yield select(state => state.files.uploading);
            if (!currentlyUploading) {
                yield put({ type: files_actions.SET_UPLOADING, payload: true })
            }
            const upload_payload = queue[0];
            const completeTask = yield fork(watch_complete_upload, upload_payload.row_idx);
            yield call(upload_file, upload_payload);
            yield join(completeTask);
            yield put({ type: dsa_actions.REMOVE_UPLOAD_FILE_FROM_QUEUE, payload: upload_payload.row_idx })
        }
        const currentlyUploading = yield select(state => state.files.uploading);
        if (currentlyUploading) {
            yield put({ type: files_actions.SET_UPLOADING, payload: false })
        }
        yield delay(1000);
    }
}

function* upload_file(payload) {
    const { folder_id, row_idx, file_path, file } = payload;
    yield electronAPI.dsaSetupUploadFileProgress(window.redux_store.dispatch);
    yield electronAPI.dsaSetupUploadComplete(window.redux_store.dispatch);
    if (file && row_idx && file_path) {
        yield electronAPI.dsaUploadFile(folder_id, row_idx, file_path);
    }
}

export default watch_upload;
