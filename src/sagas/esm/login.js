import { put, take, select, call } from 'redux-saga/effects';

import * as esm_actions from '../../actions/esm';
import { getActiveProfile, getEsmConnectionConfig } from '../../helpers/esm_profile_helpers';
import {
  findProfileById,
  profilesShareEsmHost,
} from '../../helpers/esm_session_helpers';

/**
 * Login saga - handles eSlideManager authentication
 */
export function* login(connection, username, password) {
    yield put({ type: esm_actions.ESM_SET_LOADING, payload: true });
    try {
        const response = yield electronAPI.esmLogin(connection, username, password);
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

function* performLogout() {
    try {
        const response = yield electronAPI.esmLogout();
        if (response[0]) {
            yield put({ type: esm_actions.ESM_LOGOUT_SUCCESS });
        } else {
            yield put({ type: esm_actions.ESM_LOGOUT_SUCCESS });
        }
    } catch (error) {
        console.error('eSlideManager logout error:', error.message || error);
        yield put({ type: esm_actions.ESM_LOGOUT_SUCCESS });
    }
}

function* watch_login() {
    while (true) {
        yield take(esm_actions.ESM_LOGIN);
        const esmState = yield select((state) => state.esm);
        const username = esmState.username;
        const password = esmState.password;
        const activeProfile = getActiveProfile(esmState);
        const originProfile = findProfileById(esmState, esmState.switchOriginProfileId);
        const isCrossHostSwitch = esmState.profileSwitchOpen
            && originProfile
            && activeProfile
            && !profilesShareEsmHost(originProfile, activeProfile);

        if (isCrossHostSwitch && esmState.authenticated) {
            yield call(performLogout);
        }

        const connection = yield select((state) => {
            const { canonicalUrl, proxyUrl } = getEsmConnectionConfig(state.esm);
            return { url: canonicalUrl, proxyUrl };
        });
        yield login(connection, username, password);
    }
}

function* watch_logout() {
    while (true) {
        yield take(esm_actions.ESM_LOGOUT);
        yield call(performLogout);
    }
}

export { watch_login, watch_logout };
