import { put } from 'redux-saga/effects';

import get_store from "./get_store";

import * as app_actions from '../../actions/app';
import * as files_actions from '../../actions/files';
import * as modal_actions from '../../actions/modal';
import * as config_actions from '../../actions/config';
import * as esm_actions from '../../actions/esm';
import * as dsa_actions from '../../actions/dsa';
import * as globus_actions from '../../actions/globus';
import * as upload_routing_actions from '../../actions/uploadRouting';
import { migrateUploadRoutingFromLegacy } from '../../helpers/uploadRouting_migration';

let lastPersistedSnapshotJson = null;

function* load_saved_store() {
  const store = yield get_store();
  if (store) {
    // Avoid Redux churn: if the persisted snapshot hasn't changed, don't dispatch.
    // This prevents unnecessary rerenders (e.g. thumbnail refetch) when a sync signal fires redundantly.
    const nextSnapshot = JSON.stringify(store);
    if (lastPersistedSnapshotJson === nextSnapshot) {
      return;
    }
    lastPersistedSnapshotJson = nextSnapshot;

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
    if (store.esm) {
      yield put({type: esm_actions.UPDATE_ESM, payload: store.esm});
      const mc = store.esm.mappingConfig;
      if (mc && !store.config?.naming) {
        yield put({
          type: config_actions.SET_NAMING_CONFIG,
          payload: {
            accessionMode: mc.accessionMode || 'original',
            accessionToken: mc.accessionToken || '',
            duplicateStrategy: mc.duplicateStrategy || 'suffix-index',
            fieldsOrder: Array.isArray(mc.fieldsOrder) ? mc.fieldsOrder : [],
          },
        });
      }
    }
    if (store.dsa) {
      yield put({type: dsa_actions.UPDATE_DSA, payload: store.dsa});
    }
    if (store.globus) {
      yield put({type: globus_actions.RESTORE_GLOBUS_PERSISTED, payload: store.globus});
    }
    const uploadRouting = migrateUploadRoutingFromLegacy(
      store.dsa,
      store.globus,
      store.uploadRouting
    );
    yield put({ type: upload_routing_actions.RESTORE_UPLOAD_ROUTING, payload: uploadRouting });
    if (store.files?.file_rows?.length > 0) {
      yield put({ type: config_actions.RECOMPUTE_ALL_NAMING });
    }
  }
}

export default load_saved_store