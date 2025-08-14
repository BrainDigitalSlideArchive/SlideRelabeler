import { delay, call, put, takeEvery, takeLatest, fork } from 'redux-saga/effects';

import load_saved_store from './bridge/load_saved_store';

import app from './app';
import files from './files';
import config from './config';
import dsa from './dsa';
import save_store from './bridge/save_store';

function* sagas() {
    yield fork(app);
    yield fork(files);
    yield fork(config);
    yield fork(dsa);

    yield load_saved_store();

    yield fork(save_store);
};

export default sagas;