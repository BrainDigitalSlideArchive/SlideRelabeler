import { put } from 'redux-saga/effects';

import get_store from "./get_store";

import * as app_actions from '../../actions/app';
import * as files_actions from '../../actions/files';
import * as modal_actions from '../../actions/modal';
import * as config_actions from '../../actions/config';
import * as globus_actions from '../../actions/globus';

function* load_saved_store() {
  const store = yield get_store();
  if (store) {
    if (store.files) {
      yield put({type: files_actions.UPDATE_FILES, payload: store.files});
      // Always make interface allow changes if uploaded from disk
      yield put({type: files_actions.ENABLE_CHANGES});
    }
    if (store.app) {
      yield put({type: app_actions.UPDATE_APP, payload: store.app});
    }
    if (store.modal) {
      // yield put({type: modal_actions.UPDATE_MODAL, payload: store.modal});
    }
    if (store.config) {
      yield put({type: config_actions.UPDATE_CONFIG, payload: store.config});
    }
    if (store.globus) {
      yield put({type: globus_actions.RESTORE_GLOBUS_PERSISTED, payload: store.globus});
    }
  }
}

export default load_saved_store