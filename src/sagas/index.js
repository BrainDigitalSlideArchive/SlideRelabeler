import { delay, call, put, takeEvery, takeLatest, fork } from 'redux-saga/effects';

import load_saved_store from './bridge/load_saved_store';

import * as files_actions from '../actions/files';

import app from './app';
import files from './files';
import config from './config';
import debug from './debug';
import dsa from './dsa';
import esm from './esm';

import watch_save_store from './bridge/save_store';
import watch_delete_store from './bridge/delete_store';

function* sagas() {
    yield fork(app);
    yield fork(files);
    yield fork(config);
    yield fork(debug);
    // Don't run app-only sagas in viewer routes (viewer uses a separate store).
    if (
        !window.location.hash.includes("viewer") &&
        !window.location.hash.includes("file") &&
        !window.location.hash.includes("row_idx")
    ) {
        yield fork(dsa);
        yield fork(esm);
    }

    yield load_saved_store()

    yield put({type: files_actions.NOT_PROCESSING});

    yield fork(watch_save_store);
    yield fork(watch_delete_store);
};

export default sagas;