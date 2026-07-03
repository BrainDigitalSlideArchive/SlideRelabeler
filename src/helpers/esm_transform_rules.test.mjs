import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  applyRules,
  applyRulesWithProvenance,
  applyFindReplace,
  summarizeTransformRuleSteps,
} from './esm_transform_rules.js';
import { buildEsmFieldTransforms } from './esm_transform_cell.js';

describe('applyRulesWithProvenance', () => {
  const ruleA = {
    id: 'r1',
    name: 'Normalize H&E',
    enabled: true,
    steps: [{ find: 'Initial H&E', replace: 'H&E', matchMode: 'all', caseSensitive: true }],
  };

  const ruleB = {
    id: 'r2',
    name: 'Trim suffix',
    enabled: true,
    steps: [{ find: ' Recut', replace: '', matchMode: 'all', caseSensitive: true }],
  };

  it('returns unchanged value with empty appliedRules when no rule matches', () => {
    const result = applyRulesWithProvenance('Plain stain', [ruleA]);
    assert.equal(result.value, 'Plain stain');
    assert.equal(result.original, 'Plain stain');
    assert.equal(result.changed, false);
    assert.deepEqual(result.appliedRules, []);
  });

  it('tracks rule that changed the value', () => {
    const result = applyRulesWithProvenance('Initial H&E', [ruleA]);
    assert.equal(result.value, 'H&E');
    assert.equal(result.original, 'Initial H&E');
    assert.equal(result.changed, true);
    assert.equal(result.appliedRules.length, 1);
    assert.equal(result.appliedRules[0].name, 'Normalize H&E');
    assert.equal(result.appliedRules[0].id, 'r1');
  });

  it('lists each rule that changed the value in order', () => {
    const result = applyRulesWithProvenance('Initial H&E Recut', [ruleA, ruleB]);
    assert.equal(result.value, 'H&E');
    assert.equal(result.changed, true);
    assert.equal(result.appliedRules.length, 2);
    assert.equal(result.appliedRules[0].name, 'Normalize H&E');
    assert.equal(result.appliedRules[1].name, 'Trim suffix');
  });

  it('matches applyRules final value', () => {
    const value = 'Initial H&E Recut';
    const rules = [ruleA, ruleB];
    assert.equal(applyRules(value, rules), applyRulesWithProvenance(value, rules).value);
  });
});

describe('applyFindReplace', () => {
  it('replaces literally', () => {
    assert.equal(
      applyFindReplace('abc', { find: 'a', replace: 'z', matchMode: 'all', caseSensitive: true }),
      'zbc',
    );
  });
});

describe('summarizeTransformRuleSteps', () => {
  it('returns No steps when no find text', () => {
    assert.equal(
      summarizeTransformRuleSteps({ steps: [{ find: '', replace: 'x' }] }),
      'No steps',
    );
  });

  it('formats a single step', () => {
    assert.equal(
      summarizeTransformRuleSteps({
        steps: [{ find: 'Initial H&E', replace: 'H&E' }],
      }),
      '"Initial H&E" → "H&E"',
    );
  });

  it('truncates long step text', () => {
    const longFind = 'A'.repeat(40);
    const summary = summarizeTransformRuleSteps({
      steps: [{ find: longFind, replace: 'B' }],
    });
    assert.ok(summary.includes('…'));
    assert.ok(summary.length < longFind.length + 10);
  });

  it('summarizes multiple steps', () => {
    assert.equal(
      summarizeTransformRuleSteps({
        steps: [
          { find: 'A', replace: 'B' },
          { find: 'C', replace: 'D' },
        ],
      }),
      '2 steps: "A" → "B", …',
    );
  });
});
