import { take, put, select } from 'redux-saga/effects';

import * as dsa_actions from '../../actions/dsa';

function* start_upload(folder_id, file_path) {
    const upload_response = yield electronAPI.dsaStartUpload(folder_id, file_path);
    return upload_response;
}

function* upload_chunks(upload_id, file_path) {
    const chunk_size = 1024 * 1024 * 4; // 4MB
    yield 
}

function* watch_upload() {
    while (true) {
        // payload should be the file row
        const action = yield take(dsa_actions.UPLOAD_FILE);
        const {folder_id, file} = action.payload;
        console.log("File", file);
        // const {file, folder_id} = payload;
        console.log("File.__reserved", file.__reserved);
        console.log("File.__reserved.source", file.__reserved.source);
        console.log("File.__reserved.source.path", file.__reserved.source.path);
        if (file && file.__reserved && file.__reserved.source && file.__reserved.source.path) {
            console.log("Starting upload for", file.__reserved.source.path);
            const upload_response = yield start_upload(folder_id, file.__reserved.source.path);
            console.log("Upload response", upload_response);
        }
        console.log(upload_response);
        if (upload_response[0]) {
            const upload_id = upload_response[1]._id;

        } else {
            yield put({type: dsa_actions.UPLOAD_FILE_FAILURE, payload: {file: file, error: upload_response[1].message}});
        }
    }
}

export default watch_upload;