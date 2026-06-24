import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  migrateEsmStateToProfiles,
  makeEsmProfile,
  ESM_STAIN_FILTER_ALL,
  ESM_STAIN_FILTER_MATCH,
  previewProfileOutputName,
  getEnabledMappings,
  evaluateEsmProfileMappings,
  profileMappingHeaderName,
  ESM_OUTPUT_NAME_TARGET,
  collectEsmImportColumnFields,
} from './esm_profile_helpers.js';

describe('migrateEsmStateToProfiles', () => {
  it('creates default profile from legacy singleton state', () => {
    const migrated = migrateEsmStateToProfiles({
      url: 'https://esm.example.org',
      username: 'user1',
      transformRules: [{ id: 'r1', name: 'Rule', enabled: true, steps: [] }],
      selectedTransformRuleIds: ['r1'],
      mappingConfig: {
        resultsFilterRegex: '^H&E',
        duplicateStrategy: 'suffix-index',
        fieldsOrder: ['Accession', 'BlockId', 'StainId'],
      },
    });

    assert.equal(migrated.profiles.length, 1);
    assert.equal(migrated.profiles[0].url, 'https://esm.example.org');
    assert.equal(migrated.profiles[0].transformRules.length, 1);
    assert.equal(migrated.profiles[0].stainPresets.length, 1);
    assert.equal(migrated.profiles[0].stainPresets[0].matchValue, 'H&E');
    assert.equal(migrated.rememberUsername, true);
    assert.equal(migrated.url, undefined);
  });

  it('preserves existing profiles array', () => {
    const p = makeEsmProfile({ id: 'p1', name: 'A', url: 'http://a' });
    const migrated = migrateEsmStateToProfiles({ profiles: [p], activeProfileId: 'p1' });
    assert.equal(migrated.profiles[0].id, 'p1');
  });
});

describe('previewProfileOutputName', () => {
  it('evaluates enabled output name pattern', () => {
    const profile = makeEsmProfile({
      outputNameMapping: { enabled: true, pattern: '{deid}_{blockId}' },
    });
    const slide = { BlockId: 'A1', StainId: 'H&E', BarcodeId: 'ACC-1' };
    const criteriaRow = { deid: 'CASE01' };
    const result = previewProfileOutputName(profile, slide, criteriaRow);
    assert.ok(result.includes('CASE01') || result.includes('A1'));
  });
});

describe('evaluateEsmProfileMappings', () => {
  const slide = { BlockId: 'A1', BarcodeId: 'ACC-1' };
  const criteriaRow = { deid: 'CASE01' };

  it('preserves literal {uuid} in preview mode', () => {
    const profile = makeEsmProfile({
      outputNameMapping: { enabled: true, pattern: '{deid}_{blockId}_{uuid}' },
    });
    const values = evaluateEsmProfileMappings(profile, slide, criteriaRow, { preview: true });
    assert.equal(values.get(ESM_OUTPUT_NAME_TARGET), 'CASE01_A1_{uuid}');
  });

  it('resolves uuid on import when provided', () => {
    const profile = makeEsmProfile({
      outputNameMapping: { enabled: true, pattern: '{deid}_{uuid}' },
    });
    const values = evaluateEsmProfileMappings(profile, slide, criteriaRow, {
      preview: false,
      uuid: 'abc-123',
    });
    assert.equal(values.get(ESM_OUTPUT_NAME_TARGET), 'CASE01_abc-123');
  });

  it('evaluates custom column mappings', () => {
    const profile = makeEsmProfile({
      extraColumnMappings: [
        { id: '1', enabled: true, targetColumn: 'Assembly', pattern: '{blockId}_{stainId}' },
      ],
    });
    const values = evaluateEsmProfileMappings(profile, { ...slide, StainId: 'HE' }, criteriaRow, {
      preview: true,
    });
    assert.equal(values.get('Assembly'), 'A1_HE');
  });

  it('chains mappings in order', () => {
    const profile = makeEsmProfile({
      extraColumnMappings: [
        { id: '1', enabled: true, targetColumn: 'PartA', pattern: '{blockId}' },
        { id: '2', enabled: true, targetColumn: 'PartB', pattern: '{partA}_x' },
      ],
    });
    const values = evaluateEsmProfileMappings(profile, slide, criteriaRow, { preview: true });
    assert.equal(values.get('PartA'), 'A1');
    assert.equal(values.get('PartB'), 'A1_x');
  });
});

describe('getEnabledMappings', () => {
  it('includes enabled extra column with pattern', () => {
    const profile = makeEsmProfile({
      extraColumnMappings: [
        { id: '1', enabled: true, targetColumn: 'MyCol', pattern: '{blockId}' },
      ],
    });
    assert.equal(getEnabledMappings(profile).length, 1);
    assert.equal(getEnabledMappings(profile)[0].targetColumn, 'MyCol');
  });
});

describe('profileMappingHeaderName', () => {
  it('uses friendly names for reserved targets', () => {
    assert.equal(profileMappingHeaderName({ targetColumn: ESM_OUTPUT_NAME_TARGET }), 'Output name');
    assert.equal(profileMappingHeaderName({ targetColumn: 'MyCol' }), 'MyCol');
  });
});

describe('collectEsmImportColumnFields', () => {
  it('includes custom mapping columns with values', () => {
    const profile = makeEsmProfile({
      extraColumnMappings: [
        { id: '1', enabled: true, targetColumn: 'Assembly', pattern: '{blockId}' },
      ],
    });
    const fields = collectEsmImportColumnFields(profile, [{ Assembly: 'A1_HE', Accession: 'X' }]);
    assert.ok(fields.includes('Assembly'));
    assert.ok(fields.includes('Accession'));
  });
});

describe('stain filter modes', () => {
  it('uses explicit all vs match modes', () => {
    assert.equal(ESM_STAIN_FILTER_ALL, 'all');
    assert.equal(ESM_STAIN_FILTER_MATCH, 'match');
  });
});
