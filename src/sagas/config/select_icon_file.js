import {take, put} from 'redux-saga/effects';

import * as config_actions from '../../actions/config';

export default function* select_icon_file() {
  while(true) {
    const action = yield take(config_actions.SELECT_ICON_FILE);
    const files = yield electronAPI.openFileIconDialog();
    if (files.length > 0) {
      yield put({type: config_actions.CHANGE_ICON_FILE, payload: files[0]})
    }
  }

}