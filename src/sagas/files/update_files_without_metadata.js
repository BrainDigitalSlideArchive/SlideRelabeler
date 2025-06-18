import { take, put, call, fork, delay, select } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';
import * as debug_actions from '../../actions/debug';

export function* update_file_metadata(file_row_idx, file_row) {
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
            let updated_file_row = Object.assign({}, file_row, {'__reserved': metadata})

            yield put({type: files_actions.UPDATE_FILE_ROW_WITH_METADATA, payload: {file_row_idx, updated_file_row}})
        }   
    }
    catch (err) {
        yield put({type: debug_actions.ADD_BACKEND_ERROR_MESSAGE, payload: err.message});
        yield put({type: files_actions.UPDATE_FILE_ROW_WITH_ERROR, payload: {file_row_idx, error: "Error getting metadata. Please check the file's path and ensure you have permission to access it."}})
    }
}

export function* update_files_without_metadata_worker() {
    let files_not_found = true;
    while(files_not_found) {        
        const file_rows = yield select(state => state.files.file_rows);

        if (file_rows.length > 0) {
            files_not_found = false;
        }

        for (let i = 0; i < file_rows.length; i++) {
            let file_row = file_rows[i];
            yield call(update_file_metadata, i, file_row);       
        }
        yield delay(100);
    }
}

export default function* update_files_without_metadata() {
    while(true) {
        const action = yield take(files_actions.UPDATE_FILES_WITHOUT_METADATA);
        yield put({type: files_actions.SET_METADATA_UPDATING, payload: true});
        yield call(update_files_without_metadata_worker);
        yield put({type: files_actions.SET_METADATA_UPDATING, payload: false});

    }
}