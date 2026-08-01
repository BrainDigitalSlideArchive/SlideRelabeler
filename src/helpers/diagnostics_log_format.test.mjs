import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatEngineMessagesForDiagnostics,
  formatFrontendErrorForDiagnostics,
} from './diagnostics_log_format.js';

describe('diagnostics_log_format', () => {
  it('formats frontend string and object payloads', () => {
    assert.equal(formatFrontendErrorForDiagnostics('boom'), 'frontend: boom');
    assert.equal(
      formatFrontendErrorForDiagnostics({ message: 'nope' }),
      'frontend: nope',
    );
  });

  it('formats engine message lists', () => {
    assert.deepEqual(
      formatEngineMessagesForDiagnostics(['a', { x: 1 }], 'engine-debug'),
      ['engine-debug: a', 'engine-debug: {"x":1}'],
    );
  });
});
