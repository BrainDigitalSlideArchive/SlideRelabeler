import { take, call } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';

export default function* remove_file() {
  while(true) {
    const action = yield take(files_actions.REMOVE_FILE);
    
    // Invalidate cache for removed file
    // File path is passed via action.meta to avoid needing to access state after reducer runs
    const filePath = action.meta?.filePath;
    if (filePath) {
      if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.invalidateCache) {
        yield call(window.electronAPI.invalidateCache, filePath);
      }
    }
  }
}
