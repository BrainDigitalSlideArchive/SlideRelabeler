import { take, put, select, call } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';
import { summarizeDestinationBySource } from '../../helpers/destination_directory.js';

function isValidFolder(folder) {
  return folder && typeof folder === 'string';
}

function* promptChangeOutputDirApplyMode({ defaultSourced, empty, csvSourced, userSourced }) {
  const protectedCount = csvSourced + userSourced;
  const detailParts = [];
  if (defaultSourced > 0) {
    detailParts.push(`${defaultSourced} file${defaultSourced === 1 ? '' : 's'} use the current default folder`);
  }
  if (empty > 0) {
    detailParts.push(`${empty} file${empty === 1 ? '' : 's'} have no Copy To path`);
  }
  if (protectedCount > 0) {
    detailParts.push(`${protectedCount} file${protectedCount === 1 ? '' : 's'} have CSV or manual paths that will not change`);
  }

  const response = yield call(electronAPI.showMessageBox, {
    type: 'question',
    title: 'Change output folder',
    message: 'Use the new output folder for which files?',
    detail: detailParts.join('. ') + '.',
    buttons: ['Apply to all files except those defined by CSV or manually selected', 'Current files keep existing output folder; new files use the new folder', 'Cancel'],
    defaultId: 0,
    cancelId: 2,
  });

  if (response.response === 0) return 'update_default_sourced';
  if (response.response === 1) return 'default_only';
  return null;
}

function* resolveApplyMode({ currentOutputDir, summary }) {
  const { total, empty, filled, defaultSourced } = summary;

  if (total === 0) {
    return 'default_only';
  }

  if (!currentOutputDir) {
    if (empty > 0) return 'fill_empty';
    if (filled > 0) return 'default_only';
    return 'fill_empty';
  }

  if (defaultSourced === 0 && empty === 0) {
    return 'default_only';
  }

  return yield* promptChangeOutputDirApplyMode(summary);
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
      const currentOutputDir = yield select((state) => state.files.output_dir);
      const summary = summarizeDestinationBySource(file_rows);

      const mode = yield* resolveApplyMode({ currentOutputDir, summary });
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
