import { put, take } from 'redux-saga/effects';

import * as dsa_actions from '../../actions/dsa';

export function* logout() {
    const response = yield electronAPI.dsaLogout();
    if (response[0]) {
        yield put({type: dsa_actions.LOGOUT_SUCCESS});
    }
}

function* watch_logout() {
    while(true) {
        yield take(dsa_actions.LOGOUT);
        yield logout();
    }
}

export default watch_logout;