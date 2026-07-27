import { buildPersistedStore } from './persisted_store.js';

/**
 * Stable fingerprint for a profile payload (canonical JSON).
 */
export function fingerprintPayload(payload) {
  return stableStringify(payload ?? {});
}

function stableStringify(value) {
  return JSON.stringify(sortKeysDeep(value));
}

function sortKeysDeep(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  const out = {};
  for (const key of Object.keys(value).sort()) {
    out[key] = sortKeysDeep(value[key]);
  }
  return out;
}

/**
 * Build a secret-stripped settings snapshot from the live Redux store.
 * Excludes files / session auth / audit entry history.
 */
export function buildConfigProfilePayload(store) {
  const persisted = buildPersistedStore(store) || {};
  const auditSettings = persisted.auditLog?.settings
    ? { ...persisted.auditLog.settings }
    : undefined;

  return {
    config: persisted.config ? structuredCloneSafe(persisted.config) : undefined,
    uploadRouting: persisted.uploadRouting
      ? structuredCloneSafe(persisted.uploadRouting)
      : undefined,
    esm: persisted.esm ? structuredCloneSafe(persisted.esm) : undefined,
    dsa: persisted.dsa ? structuredCloneSafe(persisted.dsa) : undefined,
    globus: persisted.globus ? structuredCloneSafe(persisted.globus) : undefined,
    apiIntegrations: persisted.apiIntegrations
      ? structuredCloneSafe(persisted.apiIntegrations)
      : undefined,
    auditLog: auditSettings ? { settings: auditSettings } : undefined,
  };
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Whether live settings diverge from the last applied/saved fingerprint.
 */
export function isProfileDirty(store, activeProfileId, activeFingerprint) {
  if (!activeProfileId || !activeFingerprint) return false;
  const live = fingerprintPayload(buildConfigProfilePayload(store));
  return live !== activeFingerprint;
}
