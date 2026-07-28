import test from 'node:test';
import assert from 'node:assert/strict';

import dsaReducer from './index.js';
import defaultState from './default_state.js';
import * as dsa_actions from '../../actions/dsa.js';

test('default state has empty folder_id and folder_path', () => {
  assert.equal(defaultState.folder_id, '');
  assert.equal(defaultState.folder_path, '');
});

test('SET_DSA_FOLDER_ID stores id', () => {
  const next = dsaReducer(defaultState, {
    type: dsa_actions.SET_DSA_FOLDER_ID,
    payload: 'abc123',
  });
  assert.equal(next.folder_id, 'abc123');
});

test('SET_DSA_FOLDER_ID empty clears path and validity', () => {
  const withFolder = {
    ...defaultState,
    folder_id: 'abc',
    folder_path: '/collection/X/folder/Y',
    dsa_folder_exists: true,
  };
  const next = dsaReducer(withFolder, {
    type: dsa_actions.SET_DSA_FOLDER_ID,
    payload: '',
  });
  assert.equal(next.folder_id, '');
  assert.equal(next.folder_path, '');
  assert.equal(next.dsa_folder_exists, null);
});

test('SET_DSA_FOLDER_PATH updates cached path', () => {
  const next = dsaReducer(defaultState, {
    type: dsa_actions.SET_DSA_FOLDER_PATH,
    payload: '/collection/Demo/Public',
  });
  assert.equal(next.folder_path, '/collection/Demo/Public');
});

test('LOGOUT_SUCCESS clears auth but keeps folder_id and path', () => {
  const loggedIn = {
    ...defaultState,
    api_auth: { authToken: { token: 't' } },
    folder_id: 'abc',
    folder_path: '/collection/X',
  };
  const next = dsaReducer(loggedIn, { type: dsa_actions.LOGOUT_SUCCESS });
  assert.equal(next.api_auth, null);
  assert.equal(next.folder_id, 'abc');
  assert.equal(next.folder_path, '/collection/X');
});

test('RESET_STORE returns default DSA state', () => {
  const dirty = {
    ...defaultState,
    api_url: 'https://example.test',
    api_auth: { token: 'x' },
    folder_id: 'abc',
    folder_path: '/a/b',
  };
  const next = dsaReducer(dirty, { type: 'RESET_STORE' });
  assert.deepEqual(next, { ...defaultState });
});
