import { put, take, select } from 'redux-saga/effects';

import * as esm_actions from '../../actions/esm';

/**
 * Login saga - handles eSlideManager authentication
 * @param {string} url - eSlideManager API URL
 * @param {string} username - Username
 * @param {string} password - Password
 */
export function* login(url, username, password) {
    yield put({ type: esm_actions.ESM_SET_LOADING, payload: true });
    try {
        const response = yield electronAPI.esmLogin(url, username, password);
        if (response[0]) {
            yield put({ type: esm_actions.ESM_LOGIN_SUCCESS, payload: response[1] });
        } else {
            yield put({ type: esm_actions.ESM_LOGIN_ERROR, payload: response[1].message || 'Login failed' });
        }
    } catch (error) {
        yield put({ type: esm_actions.ESM_LOGIN_ERROR, payload: error.message || 'Login failed' });
    } finally {
        yield put({ type: esm_actions.ESM_SET_LOADING, payload: false });
    }
}

function* watch_login() {
    while (true) {
        const payload = yield take(esm_actions.ESM_LOGIN);
        const username = yield select(state => state.esm.username);
        const password = yield select(state => state.esm.password);
        const url = yield select(state => state.esm.url);
        yield login(url, username, password);
    }
}

function* watch_logout() {
    while (true) {
        yield take(esm_actions.ESM_LOGOUT);
        try {
            const response = yield electronAPI.esmLogout();
            if (response[0]) {
                yield put({ type: esm_actions.ESM_LOGOUT_SUCCESS });
            }
        } catch (error) {
            console.error('eSlideManager logout error:', error.message || error);
            yield put({ type: esm_actions.ESM_LOGOUT_SUCCESS }); // Still clear state on error
        }
    }
}

export { watch_login, watch_logout };
