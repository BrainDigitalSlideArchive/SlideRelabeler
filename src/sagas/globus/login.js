import { put, take, select, call, fork } from 'redux-saga/effects';

import * as globus_actions from '../../actions/globus';

export function* login() {
    console.log('[Globus Login Saga] ===== LOGIN function called =====');
    const currentState = yield select(state => state.globus);
    console.log('[Globus Login Saga] Current Redux state before auth check:', {
        api_auth: currentState.api_auth,
        login_pending: currentState.login_pending,
        login_url: currentState.login_url,
        access_code: currentState.access_code,
        login_error: currentState.login_error,
        login_error_message: currentState.login_error_message
    });
    
    console.log('[Globus Login Saga] Calling electronAPI.globusCheckAuth()...');
    const response = yield call(electronAPI.globusCheckAuth);
    console.log('[Globus Login Saga] Auth check response structure:', {
        isArray: Array.isArray(response),
        length: response?.length,
        response0: response?.[0],
        response1: response?.[1],
        fullResponse: response
    });
    
    if (response && response[0]) {
        console.log('[Globus Login Saga] Already authenticated, payload:', response[1]);
        console.log('[Globus Login Saga] Dispatching LOGIN_SUCCESS with payload:', response[1]);
        yield put({ type: globus_actions.LOGIN_SUCCESS, payload: response[1] });
        // Check collection path if set
        const collection_path = yield select(state => state.globus.collection_path);
        if (collection_path) {
            console.log('[Globus Login Saga] Checking collection path:', collection_path);
            const check_path_response = yield call(electronAPI.globusCheckCollectionPath, collection_path);
            console.log('[Globus Login Saga] Collection path check response:', check_path_response);
            if (check_path_response && check_path_response[0]) {
                yield put({ type: globus_actions.GLOBUS_COLLECTION_EXISTS });
            } else {
                yield put({ 
                    type: globus_actions.GLOBUS_COLLECTION_DOES_NOT_EXIST, 
                    payload: check_path_response[1]?.message || 'Collection path validation failed' 
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
            yield put({ type: globus_actions.LOGIN_FAILURE, payload: 'Login command returned no response' });
            return;
        }
        console.log('[Globus Login Saga] Login command response structure:', {
            isArray: Array.isArray(login_response),
            length: login_response?.length,
            response0: login_response?.[0],
            response1: login_response?.[1],
            hasUrl: !!login_response?.[1]?.url,
            url: login_response?.[1]?.url,
            hasAccessCode: !!login_response?.[1]?.access_code,
            accessCode: login_response?.[1]?.access_code,
            message: login_response?.[1]?.message,
            fullResponse: login_response
        });
        
        if (login_response && login_response[0]) {
            console.log('[Globus Login Saga] Login command succeeded (response[0] is true)');
            console.log('[Globus Login Saga] URL in response:', login_response[1]?.url || 'MISSING');
            console.log('[Globus Login Saga] Access code in response:', login_response[1]?.access_code || 'MISSING');
            
            // Store URL and access code in Redux state, set login_pending
            if (login_response[1]?.url) {
                console.log('[Globus Login Saga] About to dispatch SET_LOGIN_URL with:', login_response[1].url);
                yield put({ type: globus_actions.SET_LOGIN_URL, payload: login_response[1].url });
                console.log('[Globus Login Saga] SET_LOGIN_URL dispatched');
            } else {
                console.log('[Globus Login Saga] WARNING: login_response[0] is true but no URL in response[1]');
            }
            if (login_response[1]?.access_code) {
                console.log('[Globus Login Saga] About to dispatch SET_ACCESS_CODE with:', login_response[1].access_code);
                yield put({ type: globus_actions.SET_ACCESS_CODE, payload: login_response[1].access_code });
                console.log('[Globus Login Saga] SET_ACCESS_CODE dispatched');
            }
            console.log('[Globus Login Saga] About to dispatch SET_LOGIN_PENDING with: true');
            yield put({ type: globus_actions.SET_LOGIN_PENDING, payload: true });
            console.log('[Globus Login Saga] SET_LOGIN_PENDING dispatched');
            
            const stateAfterUpdate = yield select(state => state.globus);
            console.log('[Globus Login Saga] Redux state after updates:', {
                login_pending: stateAfterUpdate.login_pending,
                login_url: stateAfterUpdate.login_url,
                access_code: stateAfterUpdate.access_code
            });
            
            // Don't immediately check auth - wait for user to complete browser flow and click "Check Auth Status"
            console.log('[Globus Login Saga] Login URL and code stored. Waiting for user to complete authentication...');
        } else {
            console.log('[Globus Login Saga] Login command failed (response[0] is false or missing)');
            console.log('[Globus Login Saga] Error message:', login_response?.[1]?.message || 'Unknown error');
            console.log('[Globus Login Saga] Dispatching LOGIN_FAILURE with:', login_response?.[1]?.message || 'Login failed');
            yield put({ type: globus_actions.LOGIN_FAILURE, payload: login_response?.[1]?.message || 'Login failed' });
            
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
    
    console.log('[Globus Login Saga] Calling electronAPI.globusCheckAuth()...');
    const auth_check = yield call(electronAPI.globusCheckAuth);
    console.log('[Globus Login Saga] Auth check response structure:', {
        isArray: Array.isArray(auth_check),
        response0: auth_check?.[0],
        response1: auth_check?.[1],
        fullResponse: auth_check
    });
    
    if (auth_check && auth_check[0]) {
        console.log('[Globus Login Saga] Authentication successful, payload:', auth_check[1]);
        console.log('[Globus Login Saga] Dispatching LOGIN_SUCCESS');
        yield put({ type: globus_actions.LOGIN_SUCCESS, payload: auth_check[1] });
    } else {
        console.log('[Globus Login Saga] Authentication failed or not completed');
        console.log('[Globus Login Saga] Dispatching LOGIN_FAILURE');
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
        
        // Check auth status
        const auth_check = yield call(electronAPI.globusCheckAuth);
        console.log('[Globus Login Saga] Auth check after code submission:', auth_check);
        
        if (auth_check && auth_check[0]) {
            console.log('[Globus Login Saga] Authentication successful after code submission');
            yield put({ type: globus_actions.LOGIN_SUCCESS, payload: auth_check[1] });
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
