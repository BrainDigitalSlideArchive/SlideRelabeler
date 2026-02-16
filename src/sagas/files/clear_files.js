import { take, call } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';

export default function* clear_files() {
  while(true) {
    yield take(files_actions.CLEAR_FILES);
    // Clear all cache when files are cleared
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.clearAllCache) {
      yield call(window.electronAPI.clearAllCache);
    }
  }
}
