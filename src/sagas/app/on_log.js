import { take, put } from 'redux-saga/effects';

import * as app_actions from '../../actions/app';

export default function* on_log(file_or_files) {
  while(true) {
    const action = yield take(app_actions.ON_LOG);
    yield electronAPI.onLog(action.payload);
  }
}