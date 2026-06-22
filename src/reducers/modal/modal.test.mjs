import test from 'node:test';
import assert from 'node:assert/strict';

import modalReducer from './index.js';
import defaultState from './default_state.js';
import * as modal_actions from '../../actions/modal.js';

test('TOGGLE_MODAL opens config when modal is closed', () => {
  const next = modalReducer(defaultState, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'config' },
  });
  assert.equal(next.active, true);
  assert.equal(next.type, 'config');
});

test('TOGGLE_MODAL switches from config to auditLog without closing', () => {
  const configOpen = modalReducer(defaultState, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'config' },
  });
  const auditLogOpen = modalReducer(configOpen, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'auditLog' },
  });
  assert.equal(auditLogOpen.active, true);
  assert.equal(auditLogOpen.type, 'auditLog');
});

test('TOGGLE_MODAL closes when toggling the same open modal type', () => {
  const auditLogOpen = modalReducer(defaultState, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'auditLog' },
  });
  const closed = modalReducer(auditLogOpen, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'auditLog' },
  });
  assert.equal(closed.active, false);
  assert.equal(closed.type, 'auditLog');
});

test('CLOSE_MODAL sets active false without changing type', () => {
  const open = modalReducer(defaultState, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'auditLog' },
  });
  const closed = modalReducer(open, { type: modal_actions.CLOSE_MODAL });
  assert.equal(closed.active, false);
  assert.equal(closed.type, 'auditLog');
});
