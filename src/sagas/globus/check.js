import { take, put, select, call, fork } from 'redux-saga/effects';
import * as globus_actions from '../../actions/globus';

function* check_auth() {
    console.log('[Globus Check Saga] CHECK_AUTH action received');
    const authStatus = yield call(electronAPI.globusAuthStatus);
    console.log('[Globus Check Saga] Auth status response:', authStatus);

    if (authStatus && authStatus.ok && authStatus.isAuthenticated) {
        const payload = { username: authStatus.username || 'Authenticated' };
        console.log('[Globus Check Saga] Authentication successful:', payload);
        yield put({ type: globus_actions.LOGIN_SUCCESS, payload });
    } else {
        console.log('[Globus Check Saga] Authentication failed or not completed');
        yield put({ type: globus_actions.LOGIN_FAILURE, payload: 'Authentication not completed. Please complete the login process in your browser and try again.' });
    }
}

function* watch_check_auth() {
    while (true) {
        yield take(globus_actions.CHECK_AUTH);
        yield check_auth();
    }
}

function* watch_check_collection_path() {
    while (true) {
        const action = yield take(globus_actions.SET_GLOBUS_COLLECTION_PATH);
        const api_auth = yield select(state => state.globus.api_auth);
        if (api_auth && action.payload) {
            const collection_path = action.payload;
            try {
                const response = yield call(electronAPI.globusCheckCollectionPath, collection_path);
                if (response && response[0]) {
                    yield put({ type: globus_actions.GLOBUS_COLLECTION_EXISTS});
                } else {
                    yield put({ type: globus_actions.GLOBUS_COLLECTION_DOES_NOT_EXIST, payload: response[1]?.message || 'Collection path validation failed'});
                }
            } catch (error) {
                yield put({ type: globus_actions.GLOBUS_COLLECTION_DOES_NOT_EXIST, payload: "Unknown error checking collection path"});
            }
        }
    }
}

export default function* rootSaga() {
    yield fork(watch_check_auth);
    yield fork(watch_check_collection_path);
}
