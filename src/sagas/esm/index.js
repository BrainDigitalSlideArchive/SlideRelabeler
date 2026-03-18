import { fork } from 'redux-saga/effects';
import { watch_login, watch_logout } from './login';
import watch_search from './search';
import { watch_apply_selection } from './apply_selection';

function* esm() {
    yield fork(watch_login);
    yield fork(watch_logout);
    yield fork(watch_search);
    yield fork(watch_apply_selection);
}

export default esm;
