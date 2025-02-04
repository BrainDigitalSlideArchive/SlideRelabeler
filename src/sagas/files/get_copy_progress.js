import { take, put } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';

export default function* get_copy_progress() {
  while(true) {
    const action = yield take(files_actions.GET_COPY_PROGRESS);
    const copy_prog = yield electronAPI.getCopyProgress(action.payload);
  }
}