import { fork } from 'redux-saga/effects';

import login from './login';
import logout from './logout';

function* dsa() {
    const watch_login = yield fork(login);
    const watch_logout = yield fork(logout);
}

export default dsa;