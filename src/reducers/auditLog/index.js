import { createReducer } from '@reduxjs/toolkit';
import { produce } from 'immer';

import defaultState, { DEFAULT_AUDIT_LOG_SETTINGS } from './default_state.js';
import { resolveAuditMaxEntries, trimAuditEntries } from '../../helpers/audit_log.js';
import { normalizeAuditLogEntries } from '../../helpers/audit_log_migration.js';

import * as app_actions from '../../actions/app.js';
import * as auditLog_actions from '../../actions/auditLog.js';

function appendEntryWithSequence(draft, entry) {
  draft.entries.push({ ...entry, sequence: draft.nextSequence });
  draft.nextSequence += 1;
}

function trimEntriesInDraft(draft) {
  const max = resolveAuditMaxEntries(draft.settings, DEFAULT_AUDIT_LOG_SETTINGS.maxEntries);
  if (max == null) return;
  draft.entries = trimAuditEntries(draft.entries, max);
}

const auditLogReducer = createReducer(defaultState, (builder) => {
  builder
    .addCase(auditLog_actions.RECORD_AUDIT_ENTRY, (state, action) => {
      return produce(state, (draft) => {
        appendEntryWithSequence(draft, action.payload);
        trimEntriesInDraft(draft);
      });
    })
    .addCase(auditLog_actions.RECORD_AUDIT_ENTRIES, (state, action) => {
      return produce(state, (draft) => {
        const next = Array.isArray(action.payload) ? action.payload : [];
        for (const entry of next) {
          appendEntryWithSequence(draft, entry);
        }
        trimEntriesInDraft(draft);
      });
    })
    .addCase(auditLog_actions.UPDATE_AUDIT_ENTRY, (state, action) => {
      return produce(state, (draft) => {
        const { id, patch } = action.payload ?? {};
        if (!id || !patch) return;
        const entry = draft.entries.find((e) => e.id === id);
        if (entry) {
          Object.assign(entry, patch);
        }
      });
    })
    .addCase(auditLog_actions.CLEAR_AUDIT_LOG, (state) => ({
      ...defaultState,
      settings: { ...state.settings },
    }))
    .addCase(auditLog_actions.CLEAR_AUDIT_ENTRIES, (state, action) => {
      return produce(state, (draft) => {
        const ids = new Set(action.payload?.ids ?? []);
        if (ids.size === 0) return;
        draft.entries = draft.entries.filter((e) => !ids.has(e.id));
      });
    })
    .addCase(auditLog_actions.SET_AUDIT_LOG_SETTINGS, (state, action) => {
      return produce(state, (draft) => {
        draft.settings = { ...draft.settings, ...action.payload };
        trimEntriesInDraft(draft);
      });
    })
    .addCase(auditLog_actions.SET_AUDIT_LOG_CURRENT_RUN, (state, action) => {
      return produce(state, (draft) => {
        draft.currentRunId = action.payload ?? null;
      });
    })
    .addCase(auditLog_actions.RESTORE_AUDIT_LOG, (state, action) => {
      const payload = action.payload ?? {};
      const { entries, nextSequence } = normalizeAuditLogEntries(payload.entries);
      return {
        ...defaultState,
        ...payload,
        settings: { ...defaultState.settings, ...(payload.settings || {}) },
        entries,
        nextSequence,
      };
    })
    .addCase(app_actions.RESET_STORE, () => ({
      ...defaultState,
      settings: { ...defaultState.settings },
    }));
});

export default auditLogReducer;
