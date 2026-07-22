import { put, take, select, call, fork } from 'redux-saga/effects';

import * as globus_actions from '../../actions/globus';
import { formatGlobusLoginError } from '../../helpers/globus_error_interpretation.js';

export function* login() {
    console.log('[Globus Login Saga] ===== LOGIN function called =====');
    yield put({ type: globus_actions.SET_AUTH_CHECK_PENDING, payload: true });

    const currentState = yield select(state => state.globus);
    console.log('[Globus Login Saga] Current Redux state before auth check:', {
        api_auth: currentState.api_auth,
        login_pending: currentState.login_pending,
        login_url: currentState.login_url,
        access_code: currentState.access_code,
        login_error: currentState.login_error,
        login_error_message: currentState.login_error_message
    });

    console.log('[Globus Login Saga] Calling electronAPI.globusAuthStatus() for preflight...');
    const authStatus = yield call(electronAPI.globusAuthStatus);
    console.log('[Globus Login Saga] Auth status response:', authStatus);

    if (authStatus && authStatus.ok && authStatus.isAuthenticated) {
        const payload = { username: authStatus.username || 'Authenticated' };
        console.log('[Globus Login Saga] Already authenticated, dispatching LOGIN_SUCCESS with payload:', payload);
        yield put({ type: globus_actions.LOGIN_SUCCESS, payload });
        // Check collection path if set
        const collection_path = yield select(state => state.globus.collection_path);
        if (collection_path) {
            console.log('[Globus Login Saga] Checking collection path:', collection_path);
            const check_path_response = yield call(electronAPI.globusListDirectory, collection_path);
            console.log('[Globus Login Saga] Collection path check response:', check_path_response);
            if (check_path_response && check_path_response[0]) {
                yield put({ type: globus_actions.GLOBUS_COLLECTION_EXISTS });
            } else {
                const err = check_path_response?.[1] || {};
                yield put({
                    type: globus_actions.GLOBUS_COLLECTION_DOES_NOT_EXIST,
                    payload: {
                        userMessage: err.message || 'Collection path validation failed',
                        userDetail: err.userDetail || null,
                        technical: err.technical || null,
                    },
                });
            }
        }
    } else {
        // Not authenticated, try to login
        console.log('[Globus Login Saga] Not authenticated, calling login command...');
        console.log('[Globus Login Saga] About to call electronAPI.globusLogin()...');
        const login_response = yield call(electronAPI.globusLogin);
        console.log('[Globus Login Saga] electronAPI.globusLogin() returned');
        console.log('[Globus Login Saga] Response type:', typeof login_response);
        console.log('[Globus Login Saga] Response is null/undefined:', login_response === null || login_response === undefined);
        if (login_response === null || login_response === undefined) {
            console.log('[Globus Login Saga] ERROR: login_response is null or undefined!');
            yield put({ type: globus_actions.SET_AUTH_CHECK_PENDING, payload: false });
            yield put({ type: globus_actions.LOGIN_FAILURE, payload: 'Login command returned no response' });
            return;
        }
        console.log('[Globus Login Saga] Login command response:', login_response);
        
        if (login_response && login_response.ok) {
            console.log('[Globus Login Saga] Login command succeeded (ok=true)');
            console.log('[Globus Login Saga] classification:', login_response.classification);
            
            // Store URL and access code in Redux state, set login_pending
            yield put({ type: globus_actions.SET_AUTH_CHECK_PENDING, payload: false });
            if (login_response.classification === 'needsBrowserAuth' && login_response.url) {
                console.log('[Globus Login Saga] About to dispatch SET_LOGIN_URL with:', login_response.url);
                yield put({ type: globus_actions.SET_LOGIN_URL, payload: login_response.url });
                console.log('[Globus Login Saga] SET_LOGIN_URL dispatched');
            } else {
                console.log('[Globus Login Saga] No URL required (already authenticated or non-browser flow).');
            }
            if (login_response.accessCode) {
                console.log('[Globus Login Saga] About to dispatch SET_ACCESS_CODE with:', login_response.accessCode);
                yield put({ type: globus_actions.SET_ACCESS_CODE, payload: login_response.accessCode });
                console.log('[Globus Login Saga] SET_ACCESS_CODE dispatched');
            }
            if (login_response.classification === 'needsBrowserAuth') {
                console.log('[Globus Login Saga] About to dispatch SET_LOGIN_PENDING with: true');
                yield put({ type: globus_actions.SET_LOGIN_PENDING, payload: true });
                console.log('[Globus Login Saga] SET_LOGIN_PENDING dispatched');
            } else {
                // If already authenticated, set LOGIN_SUCCESS immediately
                if (login_response.classification === 'alreadyAuthenticated') {
                    yield put({ type: globus_actions.LOGIN_SUCCESS, payload: { username: login_response.username } });
                }
            }
            
            const stateAfterUpdate = yield select(state => state.globus);
            console.log('[Globus Login Saga] Redux state after updates:', {
                login_pending: stateAfterUpdate.login_pending,
                login_url: stateAfterUpdate.login_url,
                access_code: stateAfterUpdate.access_code
            });
            
            // Don't immediately check auth - wait for user to complete browser flow and click "Check Auth Status"
            console.log('[Globus Login Saga] Login URL and code stored. Waiting for user to complete authentication...');
        } else {
            console.log('[Globus Login Saga] Login command failed (ok=false or missing)');
            console.log('[Globus Login Saga] Error message:', login_response?.message || 'Unknown error');
            const failureMessage = formatGlobusLoginError(
                login_response?.message || 'Login failed',
            );
            console.log('[Globus Login Saga] Dispatching LOGIN_FAILURE with:', failureMessage);
            yield put({ type: globus_actions.SET_AUTH_CHECK_PENDING, payload: false });
            yield put({ type: globus_actions.LOGIN_FAILURE, payload: failureMessage });
            
            const stateAfterFailure = yield select(state => state.globus);
            console.log('[Globus Login Saga] Redux state after LOGIN_FAILURE:', {
                login_pending: stateAfterFailure.login_pending,
                login_error: stateAfterFailure.login_error,
                login_error_message: stateAfterFailure.login_error_message
            });
        }
    }
    console.log('[Globus Login Saga] ===== LOGIN function complete =====');
}

function* check_auth() {
    console.log('[Globus Login Saga] ===== CHECK_AUTH function called =====');
    const currentState = yield select(state => state.globus);
    console.log('[Globus Login Saga] Current Redux state before check:', {
        api_auth: currentState.api_auth,
        login_pending: currentState.login_pending,
        login_url: currentState.login_url
    });
    
    console.log('[Globus Login Saga] Calling electronAPI.globusAuthStatus()...');
    const authStatus = yield call(electronAPI.globusAuthStatus);
    console.log('[Globus Login Saga] Auth status response:', authStatus);

    if (authStatus && authStatus.ok && authStatus.isAuthenticated) {
        const payload = { username: authStatus.username || 'Authenticated' };
        console.log('[Globus Login Saga] Authentication successful, payload:', payload);
        yield put({ type: globus_actions.LOGIN_SUCCESS, payload });
    } else {
        console.log('[Globus Login Saga] Authentication failed or not completed');
        yield put({ type: globus_actions.LOGIN_FAILURE, payload: 'Authentication not completed. Please complete the login process in your browser and try again.' });
    }
    console.log('[Globus Login Saga] ===== CHECK_AUTH function complete =====');
}

function* submit_authorization_code() {
    console.log('[Globus Login Saga] SUBMIT_AUTHORIZATION_CODE action received');
    const state = yield select(state => state.globus);
    const code = state.authorization_code_input;
    
    if (!code || !code.trim()) {
        console.log('[Globus Login Saga] No authorization code in state');
        yield put({ type: globus_actions.LOGIN_FAILURE, payload: 'Authorization code is required' });
        return;
    }
    
    console.log('[Globus Login Saga] Submitting authorization code...');
    const submit_response = yield call(electronAPI.globusSubmitAuthorizationCode, code.trim());
    console.log('[Globus Login Saga] Submit code response:', submit_response);
    
    if (submit_response && submit_response[0]) {
        console.log('[Globus Login Saga] Code submitted successfully, checking auth status...');
        // Clear the input field
        yield put({ type: globus_actions.SET_AUTHORIZATION_CODE_INPUT, payload: '' });
        
        // Wait a moment for authentication to complete
        yield new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check auth status via authoritative endpoint
        const authStatus = yield call(electronAPI.globusAuthStatus);
        console.log('[Globus Login Saga] Auth status after code submission:', authStatus);

        if (authStatus && authStatus.ok && authStatus.isAuthenticated) {
            console.log('[Globus Login Saga] Authentication successful after code submission');
            yield put({ type: globus_actions.LOGIN_SUCCESS, payload: { username: authStatus.username || 'Authenticated' } });
        } else {
            console.log('[Globus Login Saga] Authentication not yet complete, user may need to check status');
            yield put({ type: globus_actions.LOGIN_FAILURE, payload: 'Code submitted but authentication not yet complete. Please click "Check Auth Status" to verify.' });
        }
    } else {
        console.log('[Globus Login Saga] Code submission failed:', submit_response[1]?.message || 'Unknown error');
        yield put({ type: globus_actions.LOGIN_FAILURE, payload: submit_response[1]?.message || 'Failed to submit authorization code' });
    }
}

function* watch_login() {
    console.log('[Globus Login Saga] watch_login() watcher started');
    while (true) {
        console.log('[Globus Login Saga] watch_login() waiting for LOGIN action...');
        const action = yield take(globus_actions.LOGIN);
        console.log('[Globus Login Saga] LOGIN action received in watcher, action:', action);
        console.log('[Globus Login Saga] Calling login() function...');
        yield login();
        console.log('[Globus Login Saga] login() function completed');
    }
}

function* watch_submit_authorization_code() {
    while (true) {
        yield take(globus_actions.SUBMIT_AUTHORIZATION_CODE);
        yield submit_authorization_code();
    }
}

export default function* loginSaga() {
    yield fork(watch_login);
    yield fork(watch_submit_authorization_code);
}
