import { take, put, call, fork, delay, select, cancel, join } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';
import * as debug_actions from '../../actions/debug';

/**
 * Get a stable identifier for a file row (UUID or file path)
 * @param {object} file_row - The file row object
 * @returns {string} - UUID if available, otherwise file path
 */
function getFileRowIdentifier(file_row) {
    return file_row.__reserved?.uuid || file_row.__reserved?.source?.path;
}

export function* update_file_metadata(file_row_identifier, file_row) {
    try {
        if (!file_row.__reserved.bytes) {
            // let metadata = yield electronAPI.getMetadata(file_row.__reserved.source.path);
            let encoded = encodeURIComponent(file_row.__reserved.source.path);
            let response = yield fetch(`metadata://${encoded}`);
            let metadata = yield response.json();
            metadata = Object.assign({}, file_row.__reserved, metadata);

            let output_dir = yield select(state => state.files.output_dir);

            if (output_dir) {
                metadata.destinationDirectory = output_dir;
            }

            // make reserved
            let updated_file_row = Object.assign({}, file_row, { '__reserved': metadata })

            yield put({ type: files_actions.UPDATE_FILE_ROW_WITH_METADATA, payload: { file_row_identifier, updated_file_row } })
        }
    }
    catch (err) {
        yield put({ type: debug_actions.ADD_BACKEND_ERROR_MESSAGE, payload: err.message });
        yield put({ type: files_actions.UPDATE_FILE_ROW_WITH_ERROR, payload: { file_row_identifier, error: "Error getting metadata. Please check the file's path and ensure you have permission to access it." } })
    }
}

/**
 * Helper function to check if there are any files without metadata
 * @returns {boolean} true if any files are missing metadata (__reserved.bytes)
 */
function* hasFilesWithoutMetadata() {
    const file_rows = yield select(state => state.files.file_rows);
    return file_rows.some(row => !row.__reserved || !row.__reserved.bytes);
}

export function* update_files_without_metadata_loop() {
    // Continue looping until all files have metadata
    while (yield hasFilesWithoutMetadata()) {
        const file_rows = yield select(state => state.files.file_rows);

        // Only process files that need metadata
        for (let i = 0; i < file_rows.length; i++) {
            let file_row = file_rows[i];
            // Skip files that already have metadata
            if (!file_row.__reserved || !file_row.__reserved.bytes) {
                // Use stable identifier instead of array index
                const identifier = getFileRowIdentifier(file_row);
                if (identifier) {
                    yield call(update_file_metadata, identifier, file_row);
                }
            }
        }
        yield delay(100);
    }
}

export function* cancel_update_files_without_metadata_loop(update_files_without_metadata_loop_task) {
    yield take(files_actions.CLEAR_FILES);
    yield cancel(update_files_without_metadata_loop_task);
    console.log("Cancel update files without metadata loop task");
}

export default function* update_files_without_metadata() {
    let current_loop_task = null;
    let current_cancel_task = null;
    
    while (true) {
        const action = yield take(files_actions.UPDATE_FILES_WITHOUT_METADATA);
        
        // Cancel previous loop task and cancel watcher if they are running
        if (current_loop_task) {
            yield cancel(current_loop_task);
        }
        if (current_cancel_task) {
            yield cancel(current_cancel_task);
        }
        
        yield put({ type: files_actions.SET_METADATA_UPDATING, payload: true });
        
        // Fork the loop task and track it
        current_loop_task = yield fork(update_files_without_metadata_loop);
        // Fork the cancellation watcher
        current_cancel_task = yield fork(cancel_update_files_without_metadata_loop, current_loop_task);
        
        // Wait for the loop to complete (it will complete when all files have metadata)
        yield join(current_loop_task);
        current_loop_task = null;
        
        // Cancel the cancellation watcher since the loop completed
        if (current_cancel_task) {
            yield cancel(current_cancel_task);
            current_cancel_task = null;
        }
        
        yield put({ type: files_actions.SET_METADATA_UPDATING, payload: false });
    }
}