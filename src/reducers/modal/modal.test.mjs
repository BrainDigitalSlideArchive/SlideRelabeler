import test from 'node:test';
import assert from 'node:assert/strict';

import modalReducer from './index.js';
import defaultState from './default_state.js';
import * as modal_actions from '../../actions/modal.js';

test('TOGGLE_MODAL opens config when stack is empty', () => {
  const next = modalReducer(defaultState, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'config' },
  });
  assert.deepEqual(next.stack, ['config']);
});

test('TOGGLE_MODAL pops when toggling config', () => {
  const open = modalReducer(defaultState, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'config' },
  });
  const closed = modalReducer(open, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'config' },
  });
  assert.deepEqual(closed.stack, []);
});

test('TOGGLE_MODAL pushes auditLog on top of config', () => {
  const configOpen = modalReducer(defaultState, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'config' },
  });
  const auditLogOpen = modalReducer(configOpen, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'auditLog' },
  });
  assert.deepEqual(auditLogOpen.stack, ['config', 'auditLog']);
});

test('TOGGLE_MODAL pops when toggling the same top type', () => {
  const auditLogOpen = modalReducer(defaultState, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'auditLog' },
  });
  const closed = modalReducer(auditLogOpen, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'auditLog' },
  });
  assert.deepEqual(closed.stack, []);
});

test('CLOSE_MODAL pops top and restores previous modal', () => {
  let state = modalReducer(defaultState, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'config' },
  });
  state = modalReducer(state, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'auditLog' },
  });
  const closed = modalReducer(state, { type: modal_actions.CLOSE_MODAL });
  assert.deepEqual(closed.stack, ['config']);
});

test('CLOSE_MODAL on last modal leaves empty stack', () => {
  const open = modalReducer(defaultState, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'auditLog' },
  });
  const closed = modalReducer(open, { type: modal_actions.CLOSE_MODAL });
  assert.deepEqual(closed.stack, []);
});

test('error pushes on stack; CLOSE_MODAL restores previous and clears messages', () => {
  let state = modalReducer(defaultState, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'config' },
  });
  state = modalReducer(state, {
    type: modal_actions.DISPLAY_ERROR_MESSAGE,
    payload: 'boom',
  });
  assert.deepEqual(state.stack, ['config', 'error']);
  assert.deepEqual(state.error_messages, ['boom']);

  const closed = modalReducer(state, { type: modal_actions.CLOSE_MODAL });
  assert.deepEqual(closed.stack, ['config']);
  assert.deepEqual(closed.error_messages, []);
});

test('help over config; close returns to config', () => {
  let state = modalReducer(defaultState, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'config' },
  });
  state = modalReducer(state, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'help' },
  });
  assert.deepEqual(state.stack, ['config', 'help']);
  const closed = modalReducer(state, { type: modal_actions.CLOSE_MODAL });
  assert.deepEqual(closed.stack, ['config']);
});

test('dsaFolderPicker open and close does not leave help or config on stack', () => {
  const open = modalReducer(defaultState, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'dsaFolderPicker' },
  });
  assert.deepEqual(open.stack, ['dsaFolderPicker']);
  const closed = modalReducer(open, { type: modal_actions.CLOSE_MODAL });
  assert.deepEqual(closed.stack, []);
});

test('globusLogin stacks over globusEndpointPicker and pops cleanly', () => {
  let state = modalReducer(defaultState, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'config' },
  });
  state = modalReducer(state, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'globusEndpointPicker' },
  });
  state = modalReducer(state, {
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'globusLogin' },
  });
  assert.deepEqual(state.stack, ['config', 'globusEndpointPicker', 'globusLogin']);
  const closed = modalReducer(state, { type: modal_actions.CLOSE_MODAL });
  assert.deepEqual(closed.stack, ['config', 'globusEndpointPicker']);
});
