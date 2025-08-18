import { fork } from 'redux-saga/effects';

import login from './login';
import logout from './logout';
import upload from './upload';

function* dsa() {
    const watch_login = yield fork(login);
    const watch_logout = yield fork(logout);
    const watch_upload = yield fork(upload);
}

export default dsa;