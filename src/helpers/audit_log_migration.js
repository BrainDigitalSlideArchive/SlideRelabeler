// helpers/audit_log_migration.js — hydrate auditLog from persisted store / legacy config.

import defaultState, { DEFAULT_AUDIT_LOG_SETTINGS } from '../reducers/auditLog/default_state.js';

export function normalizeAuditLogEntries(entries) {
  const list = Array.isArray(entries) ? entries : [];
  const normalized = list.map((entry, index) => ({
    ...entry,
    sequence: typeof entry?.sequence === 'number' ? entry.sequence : index,
  }));
  const nextSequence = normalized.reduce(
    (max, entry) => Math.max(max, entry.sequence + 1),
    0,
  );
  return { entries: normalized, nextSequence };
}

export function migrateAuditLogFromStore(savedAuditLog, legacyConfig) {
  if (savedAuditLog && typeof savedAuditLog === 'object') {
    const { entries, nextSequence } = normalizeAuditLogEntries(savedAuditLog.entries);
    return {
      ...defaultState,
      ...savedAuditLog,
      settings: {
        ...DEFAULT_AUDIT_LOG_SETTINGS,
        ...(savedAuditLog.settings || {}),
      },
      entries,
      nextSequence,
    };
  }

  const enabled = legacyConfig?.csv?.save_csv !== false;
  return {
    ...defaultState,
    settings: {
      ...DEFAULT_AUDIT_LOG_SETTINGS,
      enabled,
    },
  };
}
