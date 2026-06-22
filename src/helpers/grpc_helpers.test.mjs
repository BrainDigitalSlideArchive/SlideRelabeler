import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBackendError,
  buildFileRowErrorFromBackend,
  parseStoredRowError,
  extractBackendErrorCause,
  buildUserFacingErrorSummary,
} from './grpc_helpers.js';

test('formatBackendError returns user-facing summary for tilesource errors', () => {
  const err = {
    details: 'internal_error:GetMetadata: large_image.exceptions.TileSourceError: No available tilesource for /tmp/bad.svs',
    message: '13 INTERNAL: internal_error:GetMetadata: large_image.exceptions.TileSourceError: No available tilesource for /tmp/bad.svs',
  };
  const msg = formatBackendError(err, 'Error getting metadata');
  assert.match(msg, /could not be opened|error opening this file/i);
  assert.doesNotMatch(msg, /could not be found at this path/i);
  assert.doesNotMatch(msg, /INTERNAL/);
});

test('buildFileRowErrorFromBackend maps Node path_error not_found', () => {
  const err = {
    code: 'not_found',
    message: 'path_error:not_found: ... (/tmp/missing.svs)',
    details: 'path_error:not_found: File could not be found at this path. It may be on another computer, a network share that is not mounted, or the path in the import may be incorrect.',
  };
  const { summary, details } = buildFileRowErrorFromBackend(err, 'Error getting metadata');
  assert.match(summary, /could not be found at this path/i);
  assert.doesNotMatch(summary, /corrupt/i);
  assert.match(details, /path_error:not_found/);
});

test('buildFileRowErrorFromBackend maps Python FileNotFoundError', () => {
  const err = {
    details: 'internal_error:GetMetadata: FileNotFoundError: File not found: /tmp/missing.svs',
    message: "Error invoking remote method 'metadata': Error: 13 INTERNAL: internal_error:GetMetadata: FileNotFoundError: File not found: /tmp/missing.svs",
  };
  const { summary } = buildFileRowErrorFromBackend(err, 'Error getting metadata');
  assert.match(summary, /could not be found at this path/i);
});

test('buildFileRowErrorFromBackend keeps technical details separately', () => {
  const err = {
    details: 'internal_error:GetMetadata: Exception: Could not open tile source for /tmp/bad.svs',
    message: "Error invoking remote method 'metadata': Error: 13 INTERNAL: internal_error:GetMetadata: Exception: Could not open tile source for /tmp/bad.svs",
  };
  const { summary, details } = buildFileRowErrorFromBackend(err, 'Error getting metadata');
  assert.match(summary, /could not be opened|error opening this file/i);
  assert.match(details, /Error invoking remote method/);
});

test('extractBackendErrorCause parses Electron IPC wrapped errors', () => {
  const cause = extractBackendErrorCause({
    message: "Error invoking remote method 'metadata': Error: 13 INTERNAL: internal_error:GetMetadata: Exception: Could not open tile source for /tmp/bad.svs",
    details: 'internal_error',
  });
  assert.equal(cause, 'Exception: Could not open tile source for /tmp/bad.svs');
});

test('parseStoredRowError upgrades legacy technical-only error strings', () => {
  const legacy = "Error getting metadata: Error invoking remote method 'metadata': Error: 13 INTERNAL: internal_error:GetMetadata: Exception: Could not open tile source for /tmp/bad.svs";
  const parsed = parseStoredRowError(legacy);
  assert.match(parsed.summary, /could not be opened|error opening this file/i);
  assert.equal(parsed.details, legacy);
});

test('parseStoredRowError reclassifies stored path_error technical strings', () => {
  const legacy = "path_error:not_found: File could not be found at this path. It may be on another computer, a network share that is not mounted, or the path in the import may be incorrect. (/tmp/missing.svs)";
  const parsed = parseStoredRowError(legacy);
  assert.match(parsed.summary, /could not be found at this path/i);
});

test('parseStoredRowError uses separate summary and details when provided', () => {
  const parsed = parseStoredRowError('User summary', 'Technical details');
  assert.equal(parsed.summary, 'User summary');
  assert.equal(parsed.details, 'Technical details');
});

test('buildUserFacingErrorSummary distinguishes permission errors', () => {
  const summary = buildUserFacingErrorSummary('PermissionError: Cannot read file: /tmp/x.svs', '', 'permission_denied');
  assert.match(summary, /cannot be read/i);
});

test('formatBackendError falls back when details are generic internal_error', () => {
  const err = {
    details: 'internal_error',
    message: '13 INTERNAL: internal_error',
  };
  const msg = formatBackendError(err, 'Error getting metadata');
  assert.match(msg, /could not be processed|metadata could not be read/i);
});
