import { take, put } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';

export default function* open_viewer() {
  while(true) {
    const action = yield take(files_actions.OPEN_VIEWER);
    yield electronAPI.openViewer(action.payload);
  }
}