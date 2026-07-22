import { take, call, put, select } from 'redux-saga/effects';
import * as dsa_actions from '../../actions/dsa';

/**
 * Validate folder id and refresh cached Girder resource path when authenticated.
 */
export function* refreshDsaFolderState(folder_id) {
  const id = String(folder_id || '').trim();
  if (!id) {
    yield put({ type: dsa_actions.SET_DSA_FOLDER_PATH, payload: '' });
    return;
  }

  const api_auth = yield select((state) => state.dsa.api_auth);
  if (!api_auth) {
    return;
  }

  const response = yield call(electronAPI.dsaCheckUploadFolder, id);
  if (response && response._id) {
    yield put({ type: dsa_actions.DSA_FOLDER_EXISTS });
    const pathResp = yield call(electronAPI.dsaGetResourcePath, id, 'folder');
    if (pathResp && pathResp[0]) {
      const pathValue = typeof pathResp[1] === 'string' ? pathResp[1] : (pathResp[1]?.path || '');
      yield put({ type: dsa_actions.SET_DSA_FOLDER_PATH, payload: pathValue || response.name || id });
    } else {
      yield put({
        type: dsa_actions.SET_DSA_FOLDER_PATH,
        payload: response.name || id,
      });
    }
  } else if (response && response.message) {
    yield put({ type: dsa_actions.DSA_FOLDER_DOES_NOT_EXIST, payload: response.message });
  } else {
    yield put({
      type: dsa_actions.DSA_FOLDER_DOES_NOT_EXIST,
      payload: 'Unknown error checking folder',
    });
  }
}

export default function* watch_set_folder_id() {
  while (true) {
    const action = yield take(dsa_actions.SET_DSA_FOLDER_ID);
    yield call(refreshDsaFolderState, action.payload);
  }
}
