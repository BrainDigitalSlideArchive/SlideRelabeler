import { take, put, select, call } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';
import { summarizeDestinationDirectories } from '../../selectors/outputReadiness.js';

function isValidFolder(folder) {
  return folder && typeof folder === 'string';
}

function* promptOutputDirApplyMode({ filled, empty, total }) {
  if (filled > 0 && empty > 0) {
    const response = yield call(electronAPI.showMessageBox, {
      type: 'question',
      title: 'Apply output directory',
      message: 'Some files already have a Copy To path',
      detail: `${filled} of ${total} files have a destination. Choose how to apply the new directory.`,
      buttons: ['Fill empty rows only', 'Replace all Copy To paths', 'Cancel'],
      defaultId: 0,
      cancelId: 2,
    });
    if (response.response === 0) return 'empty_only';
    if (response.response === 1) return 'all';
    return null;
  }

  if (empty === 0 && filled > 0) {
    const response = yield call(electronAPI.showMessageBox, {
      type: 'question',
      title: 'Apply output directory',
      message: 'All files already have a Copy To path',
      detail: `Replace Copy To on all ${total} files with the new directory?`,
      buttons: ['Replace all Copy To paths', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
    });
    if (response.response === 0) return 'all';
    return null;
  }

  return 'all';
}

export default function* choose_output_dir() {
  while (true) {
    yield take(files_actions.CHOOSE_OUTPUT_DIR);
    yield put({ type: files_actions.DISABLE_CHANGES });
    try {
      const folder = yield electronAPI.openFolderDialog();
      if (!isValidFolder(folder)) {
        console.log('No folder selected.');
        continue;
      }

      const file_rows = yield select((state) => state.files.file_rows);
      const { total, filled, empty } = summarizeDestinationDirectories(file_rows);
      if (total === 0) {
        continue;
      }

      const mode = yield* promptOutputDirApplyMode({ filled, empty, total });
      if (!mode) {
        continue;
      }

      yield put({
        type: files_actions.SET_OUTPUT_DIR,
        payload: { folder, mode },
      });
    } finally {
      yield put({ type: files_actions.ENABLE_CHANGES });
    }
  }
}
