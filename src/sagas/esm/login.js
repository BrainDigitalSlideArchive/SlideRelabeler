import { put, take, select, call } from 'redux-saga/effects';

import * as esm_actions from '../../actions/esm';
import { getActiveProfile, getEsmConnectionConfig } from '../../helpers/esm_profile_helpers';
import { formatEsmLoginFailure } from '../../helpers/esm_login_validation';
import {
  esmConnectionKey,
  findProfileById,
  profilesShareEsmHost,
} from '../../helpers/esm_session_helpers';

/**
 * Login saga - handles eSlideManager authentication
 */
export function* login(connection, username, password, requestBase = '') {
    yield put({ type: esm_actions.ESM_SET_LOADING, payload: true });
    try {
        const response = yield electronAPI.esmLogin(connection, username, password);
        if (response[0]) {
            yield put({ type: esm_actions.ESM_LOGIN_SUCCESS, payload: response[1] });
        } else {
            const formatted = formatEsmLoginFailure(response[1], requestBase);
            yield put({
                type: esm_actions.ESM_LOGIN_ERROR,
                payload: { message: formatted.message, openUrl: formatted.openUrl },
            });
        }
    } catch (error) {
        const formatted = formatEsmLoginFailure(error, requestBase);
        yield put({
            type: esm_actions.ESM_LOGIN_ERROR,
            payload: { message: formatted.message, openUrl: formatted.openUrl },
        });
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
        const { canonicalUrl, proxyUrl, requestBase } = getEsmConnectionConfig(esmState);
        if (!requestBase) {
            continue;
        }

        const activeProfile = getActiveProfile(esmState);
        const activeKey = activeProfile ? esmConnectionKey(activeProfile) : '';
        const sessionKey = esmState.sessionConnectionKey || '';
        const originProfile = findProfileById(esmState, esmState.switchOriginProfileId);
        const isCrossHostSwitch = esmState.profileSwitchOpen
            && originProfile
            && activeProfile
            && !profilesShareEsmHost(originProfile, activeProfile);
        const isCrossHostRelogin = Boolean(
            esmState.authenticated
            && sessionKey
            && activeKey
            && activeKey !== sessionKey,
        );

        if ((isCrossHostSwitch || isCrossHostRelogin) && esmState.authenticated) {
            yield call(performLogout);
        }

        yield login({ url: canonicalUrl, proxyUrl }, username, password, requestBase);
    }
}

function* watch_logout() {
    while (true) {
        yield take(esm_actions.ESM_LOGOUT);
        yield call(performLogout);
    }
}

export { watch_login, watch_logout };
