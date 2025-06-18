import { select } from 'redux-saga/effects';

function* get_output_file_path(file_row) {
    const file_config = yield select(state => state.config.file);

    let source = file_row.reserved.source;

    



}

export default get_output_file_path;

