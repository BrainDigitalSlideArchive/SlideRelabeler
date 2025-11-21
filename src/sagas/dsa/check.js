import { take, call, put, select } from 'redux-saga/effects';
import * as dsa_actions from '../../actions/dsa';

export default function * watch_set_folder_id() {
    while (true) {
        const action = yield take(dsa_actions.SET_DSA_FOLDER_ID);
        const api_auth = yield select(state => state.dsa.api_auth);
        if (api_auth) {
            const folder_id = action.payload;
            const response = yield call(electronAPI.dsaCheckUploadFolder, folder_id);
            if (response._id) {
                yield put({ type: dsa_actions.DSA_FOLDER_EXISTS});
            } else if (response.message) {
                yield put({ type: dsa_actions.DSA_FOLDER_DOES_NOT_EXIST, payload: response.message});
            } else {
                yield put({ type: dsa_actions.DSA_FOLDER_DOES_NOT_EXIST, payload: "Unknown error checking folder"});
            }

        }
    }
}