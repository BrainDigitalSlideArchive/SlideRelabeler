import { delay, call, put, takeEvery, takeLatest, fork } from 'redux-saga/effects';

import load_saved_store from './bridge/load_saved_store';
import { ensureDisclaimerPrompt } from '../helpers/ensure_disclaimer_prompt.js';

import * as files_actions from '../actions/files';

import app from './app';
import files from './files';
import config from './config';
import debug from './debug';
import dsa from './dsa';
import esm from './esm';
import globus from './globus';

import auditLogSaga from './auditLog';

import watch_save_store from './bridge/save_store';
import watch_delete_store, { watch_restore_defaults } from './bridge/delete_store';
import watchSyncLegacyUpload from './uploadRouting/sync_legacy_upload';
import choose_staging_dir from './uploadRouting/choose_staging_dir';
import choose_default_local_output_dir from './uploadRouting/choose_default_local_output_dir';
import sync_default_local_output_dir from './uploadRouting/sync_default_local_output_dir';
import configProfilesSaga, { load_config_profiles } from './configProfiles';

function* sagas() {
    yield fork(watchSyncLegacyUpload);
    yield fork(choose_staging_dir);
    yield fork(choose_default_local_output_dir);
    yield fork(sync_default_local_output_dir);
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
        yield fork(globus);
    }

    yield load_saved_store()
    yield* ensureDisclaimerPrompt()
    yield load_config_profiles()

    yield put({type: files_actions.NOT_PROCESSING});

    yield fork(auditLogSaga);
    yield fork(watch_save_store);
    yield fork(watch_delete_store);
    yield fork(watch_restore_defaults);
    yield fork(configProfilesSaga);
};

export default sagas;