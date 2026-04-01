import { put, take, call } from 'redux-saga/effects';

import * as globus_actions from '../../actions/globus';

export function* logout() {
    const response = yield call(electronAPI.globusLogout);
    if (response && response[0]) {
        yield put({type: globus_actions.LOGOUT_SUCCESS});
    }
}

function* watch_logout() {
    while(true) {
        yield take(globus_actions.LOGOUT);
        yield logout();
    }
}

export default watch_logout;
