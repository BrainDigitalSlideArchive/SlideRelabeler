import { fork } from 'redux-saga/effects';
import { watch_login, watch_logout } from './login';
import watch_search from './search';

function* esm() {
    yield fork(watch_login);
    yield fork(watch_logout);
    yield fork(watch_search);
}

export default esm;
