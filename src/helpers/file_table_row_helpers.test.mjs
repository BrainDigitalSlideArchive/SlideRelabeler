import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRowErrorMessage,
  canOpenViewerForRow,
  getRowErrorDisplay,
  rowHasError,
} from './file_table_row_helpers.js';

test('getRowErrorDisplay returns summary and details from reserved fields', () => {
  const row = {
    __reserved: {
      error: 'There was an error opening this file.',
      errorDetails: '13 INTERNAL: internal_error:GetMetadata: ...',
    },
  };
  const display = getRowErrorDisplay(row);
  assert.equal(display.summary, 'There was an error opening this file.');
  assert.match(display.details, /INTERNAL/);
});

test('getRowErrorMessage returns summary only', () => {
  const row = { __reserved: { error: 'User-facing summary' } };
  assert.equal(getRowErrorMessage(row), 'User-facing summary');
});

test('canOpenViewerForRow is false when row has error', () => {
  assert.equal(canOpenViewerForRow({ __reserved: { error: 'bad file' } }), false);
});

test('canOpenViewerForRow is true when row has no error', () => {
  assert.equal(canOpenViewerForRow({ __reserved: { bytes: 100 } }), true);
});

test('rowHasError detects raw reserved error without parsing', () => {
  assert.equal(rowHasError({ __reserved: { error: 'Something failed' } }), true);
  assert.equal(rowHasError({ __reserved: {} }), false);
});

test('getRowErrorDisplay falls back to raw error when parser returns empty summary', () => {
  const display = getRowErrorDisplay({ __reserved: { error: 'Plain error' } });
  assert.equal(display.summary, 'Plain error');
});
