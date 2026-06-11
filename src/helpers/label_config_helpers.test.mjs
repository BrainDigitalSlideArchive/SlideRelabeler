import test from 'node:test';
import assert from 'node:assert/strict';
import { needsSpecimenId, assemblyModeToGoal, goalToAssemblyMode } from './label_config_helpers.js';

test('assemblyModeToGoal maps modes', () => {
  assert.equal(assemblyModeToGoal('legacy'), 'one_column');
  assert.equal(assemblyModeToGoal('fields'), 'combine_fields');
  assert.equal(assemblyModeToGoal('template'), 'custom_pattern');
});

test('needsSpecimenId when deidToken in template', () => {
  const cfg = {
    label_text_assembly: { mode: 'template', template: '{deidToken}_{field:BlockId}' },
    qr_assembly: { mode: 'legacy' },
    text_column_field: { value: 'BlockId' },
  };
  assert.equal(needsSpecimenId(cfg), true);
});

test('needsSpecimenId false for simple column', () => {
  const cfg = {
    label_text_assembly: { mode: 'legacy' },
    text_column_field: { value: 'BlockId' },
  };
  assert.equal(needsSpecimenId(cfg), false);
});

test('goalToAssemblyMode round trip for combine', () => {
  assert.equal(goalToAssemblyMode('combine_fields'), 'fields');
  assert.equal(assemblyModeToGoal('fields'), 'combine_fields');
});
