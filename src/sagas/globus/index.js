import { fork } from 'redux-saga/effects';

import login from './login';
import logout from './logout';
import upload from './upload';
import check from './check';
import { watchGlobusUploadConfigSync } from './sync_upload_config';

function* globus() {
    console.log('[Globus Sagas] globus() root saga starting, forking watchers...');
    const watch_login = yield fork(login);
    console.log('[Globus Sagas] login watcher forked');
    const watch_logout = yield fork(logout);
    const watch_upload = yield fork(upload);
    const watch_check = yield fork(check);
    yield fork(watchGlobusUploadConfigSync);
    console.log('[Globus Sagas] All watchers forked');
}

export default globus;
