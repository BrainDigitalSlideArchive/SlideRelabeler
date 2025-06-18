import { take, put } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';

export default function* get_metadata() {
  while(true) {
    const action = yield take(files_actions.GET_METADATA);
    const metadata = yield electronAPI.getMetadata(action.payload);
  }
}