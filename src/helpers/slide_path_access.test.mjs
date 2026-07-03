import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, chmodSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  checkSlidePathAccessible,
  buildPathErrorForIpc,
} from './slide_path_access.js';

const testRoot = join(tmpdir(), `slide-path-access-${process.pid}`);

test('setup', () => {
  rmSync(testRoot, { recursive: true, force: true });
  mkdirSync(testRoot, { recursive: true });
});

test('checkSlidePathAccessible returns null for readable file', () => {
  const filePath = join(testRoot, 'readable.svs');
  writeFileSync(filePath, 'test');
  assert.equal(checkSlidePathAccessible(filePath), null);
});

test('checkSlidePathAccessible detects missing file', () => {
  const issue = checkSlidePathAccessible(join(testRoot, 'missing.svs'));
  assert.equal(issue.code, 'not_found');
  assert.match(issue.message, /could not be found/i);
});

test('checkSlidePathAccessible detects directory path', () => {
  const dirPath = join(testRoot, 'folder');
  mkdirSync(dirPath, { recursive: true });
  const issue = checkSlidePathAccessible(dirPath);
  assert.equal(issue.code, 'not_a_file');
});

test('checkSlidePathAccessible detects invalid path', () => {
  const issue = checkSlidePathAccessible('   ');
  assert.equal(issue.code, 'invalid_path');
});

test('buildPathErrorForIpc sets code and details', () => {
  const issue = checkSlidePathAccessible(join(testRoot, 'missing-again.svs'));
  const err = buildPathErrorForIpc(issue);
  assert.equal(err.code, 'not_found');
  assert.match(err.details, /^path_error:not_found:/);
});

test('cleanup', () => {
  rmSync(testRoot, { recursive: true, force: true });
});
