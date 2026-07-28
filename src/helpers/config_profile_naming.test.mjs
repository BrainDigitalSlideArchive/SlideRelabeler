import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateProfileName,
  isProfileNameTaken,
  resolveImportedProfileName,
  defaultExportFilename,
  sanitizeProfileFilenameBase,
} from './config_profile_naming.js';
import {
  parsePortableProfileDocument,
  buildSinglePortableFile,
  buildBundlePortableFile,
  PROFILE_KIND_SINGLE,
  PROFILE_KIND_BUNDLE,
} from './config_profile_portable.js';

test('validateProfileName trims and rejects empty/long', () => {
  assert.equal(validateProfileName('  Lab A  ').ok, true);
  assert.equal(validateProfileName('  Lab A  ').name, 'Lab A');
  assert.equal(validateProfileName('   ').ok, false);
  assert.equal(validateProfileName('x'.repeat(81)).ok, false);
});

test('isProfileNameTaken is case-insensitive and respects excludeId', () => {
  const profiles = [
    { id: '1', name: 'Lab A' },
    { id: '2', name: 'Lab B' },
  ];
  assert.equal(isProfileNameTaken('lab a', profiles), true);
  assert.equal(isProfileNameTaken('lab a', profiles, '1'), false);
  assert.equal(isProfileNameTaken('Lab C', profiles), false);
});

test('resolveImportedProfileName suffixes collisions', () => {
  const existing = [{ name: 'Lab A' }];
  assert.equal(resolveImportedProfileName('Lab A', existing), 'Lab A (imported)');
  existing.push({ name: 'Lab A (imported)' });
  assert.equal(resolveImportedProfileName('Lab A', existing), 'Lab A (imported 2)');
  assert.equal(resolveImportedProfileName('  ', []), 'Imported profile');
});

test('defaultExportFilename sanitizes', () => {
  assert.equal(defaultExportFilename('Lab A'), 'Lab-A.json');
  assert.equal(defaultExportFilename('', { bundle: true }), 'config-profiles.json');
  assert.equal(sanitizeProfileFilenameBase('a/b:c'), 'a-b-c');
});

test('parsePortableProfileDocument single and bundle', () => {
  const single = buildSinglePortableFile({
    name: 'Lab A',
    payload: { config: { configVersion: 2 } },
  });
  assert.equal(single.kind, PROFILE_KIND_SINGLE);
  const parsedSingle = parsePortableProfileDocument(single);
  assert.equal(parsedSingle.ok, true);
  assert.equal(parsedSingle.mode, 'single');
  assert.equal(parsedSingle.entries[0].name, 'Lab A');

  const bundle = buildBundlePortableFile({
    profiles: [
      { name: 'A', payload: { config: {} } },
      { name: 'B', payload: { config: {} } },
    ],
  });
  assert.equal(bundle.kind, PROFILE_KIND_BUNDLE);
  const parsedBundle = parsePortableProfileDocument(JSON.stringify(bundle));
  assert.equal(parsedBundle.ok, true);
  assert.equal(parsedBundle.mode, 'bundle');
  assert.equal(parsedBundle.entries.length, 2);
});

test('parsePortableProfileDocument rejects unknown kind', () => {
  const bad = parsePortableProfileDocument({ kind: 'nope', schemaVersion: 1 });
  assert.equal(bad.ok, false);
});
