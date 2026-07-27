import { put, select, call, take, fork } from 'redux-saga/effects';

import * as config_actions from '../../actions/config';
import * as esm_actions from '../../actions/esm';
import * as dsa_actions from '../../actions/dsa';
import * as globus_actions from '../../actions/globus';
import * as upload_routing_actions from '../../actions/uploadRouting';
import * as auditLog_actions from '../../actions/auditLog';
import * as api_integrations_actions from '../../actions/apiIntegrations';
import * as modal_actions from '../../actions/modal';
import * as config_profiles_actions from '../../actions/configProfiles';

import { migrateConfigV2 } from '../../helpers/config_v2_migration.js';
import { migrateUploadRoutingFromLegacy } from '../../helpers/uploadRouting_migration';
import { migrateAuditLogFromStore } from '../../helpers/audit_log_migration.js';
import { syncDsaUrlsAfterLoad } from '../dsa/sync_default_url.js';
import { syncGlobusUploadAfterLoad } from '../globus/sync_upload_config.js';
import {
  buildConfigProfilePayload,
  fingerprintPayload,
} from '../../helpers/config_profile_snapshot.js';
import {
  validateProfileName,
  isProfileNameTaken,
  resolveImportedProfileName,
  defaultExportFilename,
} from '../../helpers/config_profile_naming.js';
import {
  buildSinglePortableFile,
  buildBundlePortableFile,
  parsePortableProfileDocument,
} from '../../helpers/config_profile_portable.js';
import { createProfileId } from '../../helpers/config_profile_ids.js';
import set_store from '../bridge/set_store';
import { buildPersistedStore } from '../../helpers/persisted_store';

function* persistProfilesDoc(partial = {}) {
  const state = yield select((s) => s.configProfiles);
  const doc = {
    schemaVersion: 1,
    activeProfileId:
      partial.activeProfileId !== undefined ? partial.activeProfileId : state.activeProfileId,
    activeFingerprint:
      partial.activeFingerprint !== undefined
        ? partial.activeFingerprint
        : state.activeFingerprint,
    profiles: partial.profiles !== undefined ? partial.profiles : state.profiles,
  };
  yield call(electronAPI.setConfigProfiles, doc);
  yield put({ type: config_profiles_actions.HYDRATE_CONFIG_PROFILES, payload: doc });
}

export function* load_config_profiles() {
  const doc = yield call(electronAPI.getConfigProfiles);
  yield put({
    type: config_profiles_actions.HYDRATE_CONFIG_PROFILES,
    payload: doc || {
      profiles: [],
      activeProfileId: null,
      activeFingerprint: null,
    },
  });
}

/**
 * Apply a profile payload to live Redux (settings only — does not touch file list).
 */
export function* applyConfigProfilePayload(payload) {
  if (!payload || typeof payload !== 'object') return;

  if (payload.config) {
    const { config: migratedConfig, wasReset } = migrateConfigV2(payload.config, payload.esm);
    yield put({ type: config_actions.UPDATE_CONFIG, payload: migratedConfig });
    if (wasReset) {
      yield put({
        type: modal_actions.DISPLAY_WARNING_MESSAGE,
        payload:
          'Imported configuration was upgraded to v2. Assembly and routing settings were migrated.',
      });
    }
  }

  if (payload.esm) {
    yield put({ type: esm_actions.UPDATE_ESM, payload: payload.esm });
  }
  if (payload.dsa) {
    yield put({ type: dsa_actions.UPDATE_DSA, payload: payload.dsa });
  }
  if (payload.globus) {
    yield put({ type: globus_actions.RESTORE_GLOBUS_PERSISTED, payload: payload.globus });
  }

  const uploadRouting = migrateUploadRoutingFromLegacy(
    payload.dsa,
    payload.globus,
    payload.uploadRouting,
  );
  yield put({ type: upload_routing_actions.RESTORE_UPLOAD_ROUTING, payload: uploadRouting });

  yield* syncDsaUrlsAfterLoad();
  yield* syncGlobusUploadAfterLoad();

  const auditLogState = migrateAuditLogFromStore(payload.auditLog, payload.config);
  // Keep existing audit entries; only restore settings from profile.
  const currentAudit = yield select((s) => s.auditLog);
  yield put({
    type: auditLog_actions.RESTORE_AUDIT_LOG,
    payload: {
      ...currentAudit,
      settings: {
        ...(currentAudit?.settings || {}),
        ...(auditLogState?.settings || {}),
      },
    },
  });

  if (payload.apiIntegrations) {
    yield put({
      type: api_integrations_actions.RESTORE_API_INTEGRATIONS,
      payload: payload.apiIntegrations,
    });
  }

  const store = yield select();
  yield set_store(buildPersistedStore(store));
}

function* watch_save_as() {
  while (true) {
    const action = yield take(config_profiles_actions.SAVE_CONFIG_PROFILE_AS);
    const rawName = action.payload?.name;
    const nameCheck = validateProfileName(rawName);
    if (!nameCheck.ok) {
      window.alert(nameCheck.error);
      continue;
    }
    const profiles = yield select((s) => s.configProfiles.profiles);
    if (isProfileNameTaken(nameCheck.name, profiles)) {
      window.alert('That name is already used.');
      continue;
    }

    const store = yield select();
    const payload = buildConfigProfilePayload(store);
    const fingerprint = fingerprintPayload(payload);
    const profile = {
      id: createProfileId(),
      name: nameCheck.name,
      updatedAt: new Date().toISOString(),
      fingerprint,
      payload,
    };
    const nextProfiles = [...profiles, profile];
    yield* persistProfilesDoc({
      profiles: nextProfiles,
      activeProfileId: profile.id,
      activeFingerprint: fingerprint,
    });
  }
}

function* watch_save_active() {
  while (true) {
    yield take(config_profiles_actions.SAVE_ACTIVE_CONFIG_PROFILE);
    const { profiles, activeProfileId } = yield select((s) => s.configProfiles);
    if (!activeProfileId) {
      window.alert('No active profile to save. Use Save as… to create one.');
      continue;
    }
    const idx = profiles.findIndex((p) => p.id === activeProfileId);
    if (idx < 0) {
      window.alert('Active profile was not found.');
      continue;
    }
    const store = yield select();
    const payload = buildConfigProfilePayload(store);
    const fingerprint = fingerprintPayload(payload);
    const nextProfiles = profiles.map((p, i) =>
      i === idx
        ? {
            ...p,
            updatedAt: new Date().toISOString(),
            fingerprint,
            payload,
          }
        : p,
    );
    yield* persistProfilesDoc({
      profiles: nextProfiles,
      activeProfileId,
      activeFingerprint: fingerprint,
    });
  }
}

function* watch_switch() {
  while (true) {
    const action = yield take(config_profiles_actions.SWITCH_CONFIG_PROFILE);
    const id = action.payload?.id;
    const profiles = yield select((s) => s.configProfiles.profiles);
    const profile = profiles.find((p) => p.id === id);
    if (!profile) {
      window.alert('Profile not found.');
      continue;
    }
    const ok = window.confirm(
      `Replace current settings with “${profile.name}”? Your working settings will change to this profile.`,
    );
    if (!ok) continue;

    yield* applyConfigProfilePayload(profile.payload);
    yield* persistProfilesDoc({
      activeProfileId: profile.id,
      activeFingerprint: profile.fingerprint || fingerprintPayload(profile.payload),
    });
  }
}

function* watch_rename() {
  while (true) {
    const action = yield take(config_profiles_actions.RENAME_CONFIG_PROFILE);
    const { id, name: rawName } = action.payload || {};
    const nameCheck = validateProfileName(rawName);
    if (!nameCheck.ok) {
      window.alert(nameCheck.error);
      continue;
    }
    const profiles = yield select((s) => s.configProfiles.profiles);
    if (isProfileNameTaken(nameCheck.name, profiles, id)) {
      window.alert('That name is already used.');
      continue;
    }
    const nextProfiles = profiles.map((p) =>
      p.id === id ? { ...p, name: nameCheck.name } : p,
    );
    yield* persistProfilesDoc({ profiles: nextProfiles });
  }
}

function* watch_delete_profile() {
  while (true) {
    const action = yield take(config_profiles_actions.DELETE_CONFIG_PROFILE);
    const ids = Array.isArray(action.payload?.ids)
      ? action.payload.ids
      : action.payload?.id
        ? [action.payload.id]
        : [];
    if (!ids.length) continue;

    const profiles = yield select((s) => s.configProfiles.profiles);
    const names = profiles.filter((p) => ids.includes(p.id)).map((p) => p.name);
    const label =
      names.length === 1
        ? `Delete profile “${names[0]}”?`
        : `Delete ${names.length} profiles?`;
    if (!window.confirm(label)) continue;

    const { activeProfileId } = yield select((s) => s.configProfiles);
    const nextProfiles = profiles.filter((p) => !ids.includes(p.id));
    const clearActive = ids.includes(activeProfileId);
    yield* persistProfilesDoc({
      profiles: nextProfiles,
      ...(clearActive
        ? { activeProfileId: null, activeFingerprint: null }
        : {}),
    });
  }
}

function isSaveDialogCanceled(file) {
  return !file || (typeof file === 'object' && file.error);
}

function* exportJson(doc, defaultPath) {
  const file = yield call(electronAPI.openSaveFileDialog, ['json'], defaultPath);
  if (isSaveDialogCanceled(file)) return false;
  const path = typeof file === 'string' ? file : file.filePath;
  if (!path) return false;
  yield call(electronAPI.writeTextFile, path, JSON.stringify(doc, null, 2));
  return true;
}

function* watch_export_current() {
  while (true) {
    const action = yield take(config_profiles_actions.EXPORT_CURRENT_CONFIG_PROFILE);
    const store = yield select();
    const { profiles, activeProfileId, activeFingerprint } = store.configProfiles;
    const active = profiles.find((p) => p.id === activeProfileId);
    const liveFp = fingerprintPayload(buildConfigProfilePayload(store));
    const cleanActive = active && activeFingerprint && liveFp === activeFingerprint;

    let name;
    if (cleanActive && !action.payload?.name) {
      name = active.name;
    } else {
      const raw = action.payload?.name;
      const nameCheck = validateProfileName(raw);
      if (!nameCheck.ok) {
        window.alert(nameCheck.error || 'Enter a name for the exported profile.');
        continue;
      }
      name = nameCheck.name;
    }

    const payload = buildConfigProfilePayload(store);
    const doc = buildSinglePortableFile({ name, payload });
    yield* exportJson(doc, defaultExportFilename(name));
  }
}

function* watch_export_selected() {
  while (true) {
    const action = yield take(config_profiles_actions.EXPORT_SELECTED_CONFIG_PROFILES);
    const selectedIds = Array.isArray(action.payload?.ids) ? action.payload.ids : [];
    const profiles = yield select((s) => s.configProfiles.profiles);
    let toExport;
    if (selectedIds.length === 0) {
      toExport = profiles;
    } else {
      toExport = profiles.filter((p) => selectedIds.includes(p.id));
    }
    if (!toExport.length) {
      window.alert('No profiles to export.');
      continue;
    }

    if (toExport.length === 1) {
      const p = toExport[0];
      const doc = buildSinglePortableFile({ name: p.name, payload: p.payload });
      yield* exportJson(doc, defaultExportFilename(p.name));
    } else {
      const doc = buildBundlePortableFile({
        profiles: toExport.map((p) => ({ name: p.name, payload: p.payload })),
      });
      yield* exportJson(doc, defaultExportFilename('', { bundle: true }));
    }
  }
}

function* watch_import() {
  while (true) {
    yield take(config_profiles_actions.IMPORT_CONFIG_PROFILES);
    const picked = yield call(electronAPI.openJsonFileDialog);
    if (isSaveDialogCanceled(picked)) continue;
    const path = typeof picked === 'string' ? picked : picked.filePath;
    if (!path) continue;

    const read = yield call(electronAPI.readTextFile, path);
    if (!read?.ok) {
      window.alert(read?.message || 'Could not read file.');
      continue;
    }

    const parsed = parsePortableProfileDocument(read.contents);
    if (!parsed.ok) {
      window.alert(parsed.error);
      continue;
    }

    const profiles = yield select((s) => s.configProfiles.profiles);
    const working = [...profiles];
    const created = [];

    for (const entry of parsed.entries) {
      const name = resolveImportedProfileName(entry.name, working);
      const fingerprint = fingerprintPayload(entry.payload);
      const profile = {
        id: createProfileId(),
        name,
        updatedAt: new Date().toISOString(),
        fingerprint,
        payload: entry.payload,
      };
      working.push(profile);
      created.push(profile);
    }

    yield* persistProfilesDoc({ profiles: working });

    if (parsed.mode === 'single' && created.length === 1) {
      const apply = window.confirm(
        `Imported “${created[0].name}”. Apply these settings now?`,
      );
      if (apply) {
        yield* applyConfigProfilePayload(created[0].payload);
        yield* persistProfilesDoc({
          activeProfileId: created[0].id,
          activeFingerprint: created[0].fingerprint,
        });
      }
    } else {
      window.alert(`Imported ${created.length} profile${created.length === 1 ? '' : 's'}.`);
    }
  }
}

export default function* configProfilesSaga() {
  yield fork(watch_save_as);
  yield fork(watch_save_active);
  yield fork(watch_switch);
  yield fork(watch_rename);
  yield fork(watch_delete_profile);
  yield fork(watch_export_current);
  yield fork(watch_export_selected);
  yield fork(watch_import);
}
