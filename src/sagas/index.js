import { delay, call, put, takeEvery, takeLatest, fork } from 'redux-saga/effects';

import load_saved_store from './bridge/load_saved_store';

import * as files_actions from '../actions/files';

import app from './app';
import files from './files';
import config from './config';
import debug from './debug';

import save_store from './bridge/save_store';
import delete_store from './bridge/delete_store';

function* sagas() {
    yield fork(app);
    yield fork(files);
    yield fork(config);
    yield fork(debug);

    yield load_saved_store()

    yield put({type: files_actions.NOT_PROCESSING});

    yield fork(save_store);
    yield fork(delete_store);
};

export default sagas;