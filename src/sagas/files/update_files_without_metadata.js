import { take, put, call, fork, delay, select, cancel } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';
import * as debug_actions from '../../actions/debug';
import { buildFileRowErrorFromBackend } from '../../helpers/grpc_helpers';

function isMetadataTerminal(file_row) {
    const reserved = file_row?.__reserved;
    if (!reserved) {
        return true;
    }
    return !!(reserved.bytes || reserved.error);
}

function allRowsMetadataTerminal(file_rows) {
    if (!Array.isArray(file_rows) || file_rows.length === 0) {
        return true;
    }
    return file_rows.every(isMetadataTerminal);
}

export function* update_file_metadata(file_row_idx, file_row) {
    try {
        if (file_row.__reserved.bytes || file_row.__reserved.error) {
            return true;
        }

        let metadata = yield call(electronAPI.getMetadata, file_row.__reserved.source.path);
        metadata = Object.assign({}, file_row.__reserved, metadata);

        let output_dir = yield select(state => state.files.output_dir);

        if (output_dir) {
            metadata.destinationDirectory = output_dir;
        }

        let updated_file_row = Object.assign({}, file_row, { '__reserved': metadata })

        yield put({ type: files_actions.UPDATE_FILE_ROW_WITH_METADATA, payload: { file_row_idx, updated_file_row } })
        return true;
    }
    catch (err) {
        const { summary, details } = buildFileRowErrorFromBackend(err, 'Error getting metadata');
        yield put({ type: debug_actions.ADD_BACKEND_ERROR_MESSAGE, payload: details });
        yield put({
            type: files_actions.UPDATE_FILE_ROW_WITH_ERROR,
            payload: { file_row_idx, error: summary, errorDetails: details },
        })
        return false;
    }
}

export function* cancel_update_files_without_metadata_loop(update_files_without_metadata_loop_task) {
    yield take(files_actions.CLEAR_FILES);
    yield cancel(update_files_without_metadata_loop_task);
}

export function* update_files_without_metadata_worker() {
    let update_files_without_metadata_loop_task = yield fork(update_files_without_metadata_loop);
    yield fork(cancel_update_files_without_metadata_worker, update_files_without_metadata_loop_task);
}

export function* update_files_without_metadata_loop() {
    console.log("Update files without metadata loop started");

    let file_rows = yield select(state => state.files.file_rows);

    while (!allRowsMetadataTerminal(file_rows)) {
        for (let i = 0; i < file_rows.length; i++) {
            const file_row = file_rows[i];
            if (!isMetadataTerminal(file_row)) {
                yield call(update_file_metadata, i, file_row);
            }
        }

        file_rows = yield select(state => state.files.file_rows);
        if (allRowsMetadataTerminal(file_rows)) {
            break;
        }

        yield delay(100);
    }

    yield put({ type: files_actions.SET_METADATA_UPDATING, payload: false });
    console.log("Update files without metadata loop ended");
}

export function* cancel_update_files_without_metadata_worker(update_files_metadata_worker_task) {
    const action = yield take(files_actions.CLEAR_FILES);
    yield cancel(update_files_metadata_worker_task);
    console.log("Cancel update files without metadata worker task");
}

export default function* update_files_without_metadata() {
    while (true) {
        const action = yield take(files_actions.UPDATE_FILES_WITHOUT_METADATA);
        let update_files_metadata_worker_task = yield fork(update_files_without_metadata_worker);
        yield put({ type: files_actions.SET_METADATA_UPDATING, payload: true });
    }
}
