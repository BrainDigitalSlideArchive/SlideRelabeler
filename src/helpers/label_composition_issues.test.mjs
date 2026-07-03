import test from 'node:test';
import assert from 'node:assert/strict';
import { getLabelCompositionIssues } from './label_composition_issues.js';

test('getLabelCompositionIssues flags missing icon', () => {
  const issues = getLabelCompositionIssues(
    { add_icon: true },
    {},
    null,
  );
  assert.equal(issues.length, 1);
  assert.equal(issues[0].feature, 'icon');
});

test('getLabelCompositionIssues ignores icon when disabled', () => {
  const issues = getLabelCompositionIssues(
    { add_icon: false },
    {},
    null,
  );
  assert.equal(issues.length, 0);
});

test('getLabelCompositionIssues flags empty QR pattern', () => {
  const issues = getLabelCompositionIssues(
    { add_qr: true, qrDefault: 'pattern', qrPattern: '  ' },
    { qrPayload: '' },
    '/logo.png',
  );
  assert.equal(issues.length, 1);
  assert.equal(issues[0].feature, 'qr');
  assert.ok(issues[0].message.includes('pattern'));
});

test('getLabelCompositionIssues no issues when composition complete', () => {
  const issues = getLabelCompositionIssues(
    { add_icon: true, add_qr: true, add_text: true, textDefault: 'output_name' },
    { labelText: 'CASE_1', qrPayload: 'uuid-1' },
    '/logo.png',
  );
  assert.equal(issues.length, 0);
});
