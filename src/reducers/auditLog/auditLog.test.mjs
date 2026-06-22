import test from 'node:test';
import assert from 'node:assert/strict';

import auditLogReducer from './index.js';
import defaultState from './default_state.js';
import * as auditLog_actions from '../../actions/auditLog.js';

test('RECORD_AUDIT_ENTRY assigns incrementing sequence numbers', () => {
  let state = auditLogReducer(defaultState, {
    type: auditLog_actions.RECORD_AUDIT_ENTRY,
    payload: { id: 'a', type: 'batch_start' },
  });
  state = auditLogReducer(state, {
    type: auditLog_actions.RECORD_AUDIT_ENTRY,
    payload: { id: 'b', type: 'slide_processed' },
  });
  state = auditLogReducer(state, {
    type: auditLog_actions.RECORD_AUDIT_ENTRY,
    payload: { id: 'c', type: 'batch_complete' },
  });

  assert.deepEqual(state.entries.map((e) => e.sequence), [0, 1, 2]);
  assert.equal(state.nextSequence, 3);
});

test('CLEAR_AUDIT_LOG resets sequence counter', () => {
  let state = auditLogReducer(defaultState, {
    type: auditLog_actions.RECORD_AUDIT_ENTRY,
    payload: { id: 'a' },
  });
  state = auditLogReducer(state, { type: auditLog_actions.CLEAR_AUDIT_LOG });
  assert.deepEqual(state.entries, []);
  assert.equal(state.nextSequence, 0);
});

test('RESTORE_AUDIT_LOG normalizes missing sequence values', () => {
  const restored = auditLogReducer(defaultState, {
    type: auditLog_actions.RESTORE_AUDIT_LOG,
    payload: {
      entries: [{ id: 'x' }, { id: 'y', sequence: 5 }],
      settings: { enabled: true },
    },
  });

  assert.equal(restored.entries[0].sequence, 0);
  assert.equal(restored.entries[1].sequence, 5);
  assert.equal(restored.nextSequence, 6);
});

test('UPDATE_AUDIT_ENTRY patches an existing entry by id', () => {
  let state = auditLogReducer(defaultState, {
    type: auditLog_actions.RECORD_AUDIT_ENTRY,
    payload: { id: 'start-1', type: 'batch_start', status: 'pending' },
  });
  state = auditLogReducer(state, {
    type: auditLog_actions.UPDATE_AUDIT_ENTRY,
    payload: { id: 'start-1', patch: { status: 'success' } },
  });
  assert.equal(state.entries[0].status, 'success');
});

test('default maxEntries is unlimited', () => {
  assert.equal(defaultState.settings.maxEntries, null);
});

test('RECORD_AUDIT_ENTRY does not trim when maxEntries is unlimited', () => {
  const entries = Array.from({ length: 12 }, (_, i) => ({ id: String(i) }));
  let state = {
    ...defaultState,
    settings: { ...defaultState.settings, maxEntries: null },
    entries,
    nextSequence: entries.length,
  };
  state = auditLogReducer(state, {
    type: auditLog_actions.RECORD_AUDIT_ENTRY,
    payload: { id: 'new' },
  });
  assert.equal(state.entries.length, 13);
});

test('SET_AUDIT_LOG_SETTINGS trims when limit is lowered below entry count', () => {
  const entries = Array.from({ length: 5 }, (_, i) => ({ id: String(i), sequence: i }));
  let state = {
    ...defaultState,
    settings: { ...defaultState.settings, maxEntries: null },
    entries,
    nextSequence: 5,
  };
  state = auditLogReducer(state, {
    type: auditLog_actions.SET_AUDIT_LOG_SETTINGS,
    payload: { maxEntries: 2 },
  });
  assert.equal(state.settings.maxEntries, 2);
  assert.equal(state.entries.length, 2);
  assert.deepEqual(state.entries.map((e) => e.id), ['3', '4']);
});
