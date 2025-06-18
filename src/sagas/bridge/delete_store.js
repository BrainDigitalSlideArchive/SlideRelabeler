import { take, put } from 'redux-saga/effects';

import * as app_actions from '../../actions/app';

function* delete_store() {
    while(true) {
        yield take(app_actions.DELETE_STORE);
        yield put({type: app_actions.RESET_STORE});
        yield electronAPI.deleteStore();
    }
}

export default delete_store;


