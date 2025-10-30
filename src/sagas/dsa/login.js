import { put, take, select } from 'redux-saga/effects';

import * as dsa_actions from '../../actions/dsa';

export function* login(api_url, username, password) {
    const response = yield electronAPI.dsaLogin(api_url, username, password);
    if (response[0]) {
        yield put({ type: dsa_actions.LOGIN_SUCCESS, payload: response[1] });
    } else {
        yield put({ type: dsa_actions.LOGIN_FAILURE, payload: response[1].message });
    }
}

function* watch_login() {
    while (true) {
        const payload = yield take(dsa_actions.LOGIN);
        const username = yield select(state => state.dsa.username);
        const password = yield select(state => state.dsa.password);
        const api_url = yield select(state => state.dsa.api_url);
        console.log("login with", api_url, username, password);
        yield login(api_url, username, password);
    }
}

export default watch_login;