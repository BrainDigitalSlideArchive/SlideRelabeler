import test from 'node:test';
import assert from 'node:assert/strict';

import {
  GLOBUS_LOCAL_ENDPOINT_FAILURE_KIND,
  GLOBUS_LS_FAILURE_KIND,
  formatGlobusLoginError,
  interpretGlobusCliFailure,
  interpretGlobusLocalEndpointFailure,
  interpretGlobusLsFailure,
} from './globus_error_interpretation.js';

test('interpretGlobusLsFailure maps spawn globus ENOENT to CLI unavailable', () => {
  const result = interpretGlobusLsFailure('spawn globus ENOENT');
  assert.equal(result.kind, GLOBUS_LS_FAILURE_KIND.CLI_UNAVAILABLE);
  assert.match(result.userSummary, /Globus CLI is not available/i);
  assert.match(result.userDetail, /Install Globus CLI/i);
});

test('interpretGlobusCliFailure accepts Error objects with ENOENT', () => {
  const result = interpretGlobusCliFailure(new Error('spawn globus ENOENT'));
  assert.equal(result.kind, GLOBUS_LS_FAILURE_KIND.CLI_UNAVAILABLE);
  assert.match(result.userSummary, /Globus CLI is not available/i);
});

test('interpretGlobusCliFailure maps command not found', () => {
  const result = interpretGlobusCliFailure('globus: command not found');
  assert.equal(result.kind, GLOBUS_LS_FAILURE_KIND.CLI_UNAVAILABLE);
});

test('interpretGlobusCliFailure keeps non-CLI failures as unknown with summary', () => {
  const result = interpretGlobusCliFailure('Endpoint search timed out');
  assert.equal(result.kind, GLOBUS_LS_FAILURE_KIND.UNKNOWN);
  assert.ok(result.userSummary);
});

test('formatGlobusLoginError humanizes ENOENT for login UI', () => {
  const text = formatGlobusLoginError('spawn globus ENOENT');
  assert.match(text, /Globus CLI is not available/i);
  assert.doesNotMatch(text, /ENOENT/);
});

test('formatGlobusLoginError never surfaces list-folder copy', () => {
  const text = formatGlobusLoginError('Globus could not list folders here.');
  assert.match(text, /sign-in failed/i);
  assert.doesNotMatch(text, /list folders/i);
});

test('interpretGlobusCliFailure unknown does not reuse list-folder summary', () => {
  const result = interpretGlobusCliFailure('something opaque went wrong with login');
  assert.equal(result.kind, GLOBUS_LS_FAILURE_KIND.UNKNOWN);
  assert.doesNotMatch(result.userDetail || '', /list folders/i);
  assert.doesNotMatch(result.userSummary || '', /list folders/i);
});

test('interpretGlobusLocalEndpointFailure prefers login_required code', () => {
  const result = interpretGlobusLocalEndpointFailure({
    code: 'login_required',
    message: 'Sign in to Globus before Auto-detect can read this computer’s endpoint ID.',
  });
  assert.equal(result.kind, GLOBUS_LOCAL_ENDPOINT_FAILURE_KIND.LOGIN_REQUIRED);
  assert.match(result.userSummary, /Sign in to Globus/i);
});

test('interpretGlobusLocalEndpointFailure keeps long GCP messages without truncating', () => {
  const long =
    'Globus Connect Personal does not appear configured on this machine, or the local endpoint could not be read. Install and run Globus Connect Personal, then try Auto-detect again. Extra diagnostic detail that exceeds one hundred twenty characters intentionally.';
  assert.ok(long.length > 120);
  const result = interpretGlobusLocalEndpointFailure({
    code: 'gcp_unavailable',
    message: long,
  });
  assert.equal(result.kind, GLOBUS_LOCAL_ENDPOINT_FAILURE_KIND.GCP_UNAVAILABLE);
  assert.equal(result.userSummary, long);
  assert.doesNotMatch(result.userSummary, /Globus request failed/i);
});

test('interpretGlobusLocalEndpointFailure maps cli_unavailable code', () => {
  const result = interpretGlobusLocalEndpointFailure({
    code: 'cli_unavailable',
    message: 'Globus CLI not available.',
  });
  assert.equal(result.kind, GLOBUS_LOCAL_ENDPOINT_FAILURE_KIND.CLI_UNAVAILABLE);
});
