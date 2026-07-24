import test from 'node:test';
import assert from 'node:assert/strict';

import {
  INVALID_GIRDER_API_URL_MESSAGE,
  formatDsaBaseUrl,
  getGirderVersionLabel,
  isGirderVersionResponse,
} from './dsa_url.js';

test('formatDsaBaseUrl strips trailing /api/v1', () => {
  assert.equal(
    formatDsaBaseUrl('https://bdsa.pathology.example.org/api/v1'),
    'https://bdsa.pathology.example.org',
  );
});

test('formatDsaBaseUrl strips trailing slash before and after api/v1', () => {
  assert.equal(
    formatDsaBaseUrl('https://bdsa.example.org/api/v1/'),
    'https://bdsa.example.org',
  );
});

test('formatDsaBaseUrl leaves host without api segment', () => {
  assert.equal(formatDsaBaseUrl('https://bdsa.example.org'), 'https://bdsa.example.org');
});

test('formatDsaBaseUrl handles empty and null', () => {
  assert.equal(formatDsaBaseUrl(''), '');
  assert.equal(formatDsaBaseUrl(null), '');
  assert.equal(formatDsaBaseUrl(undefined), '');
});

test('isGirderVersionResponse accepts release field (Girder >= 3)', () => {
  assert.equal(isGirderVersionResponse({ release: '3.2.6' }), true);
});

test('isGirderVersionResponse accepts apiVersion field (Girder < 3)', () => {
  assert.equal(isGirderVersionResponse({ apiVersion: '2.5.0' }), true);
});

test('isGirderVersionResponse accepts api field', () => {
  assert.equal(isGirderVersionResponse({ api: '3.1.0' }), true);
});

test('isGirderVersionResponse accepts version field', () => {
  assert.equal(isGirderVersionResponse({ version: '1.2.3' }), true);
});

test('isGirderVersionResponse rejects non-objects and empty objects', () => {
  assert.equal(isGirderVersionResponse(null), false);
  assert.equal(isGirderVersionResponse(undefined), false);
  assert.equal(isGirderVersionResponse('3.1'), false);
  assert.equal(isGirderVersionResponse([]), false);
  assert.equal(isGirderVersionResponse({}), false);
  assert.equal(isGirderVersionResponse({ message: 'ok' }), false);
});

test('getGirderVersionLabel prefers release over other fields', () => {
  assert.equal(
    getGirderVersionLabel({
      release: '3.2.6',
      apiVersion: '2.0',
      api: '1.0',
      version: '0.1',
    }),
    '3.2.6',
  );
});

test('getGirderVersionLabel falls back through apiVersion, api, version', () => {
  assert.equal(getGirderVersionLabel({ apiVersion: '2.5.0' }), '2.5.0');
  assert.equal(getGirderVersionLabel({ api: '3.1.0' }), '3.1.0');
  assert.equal(getGirderVersionLabel({ version: '1.2.3' }), '1.2.3');
  assert.equal(getGirderVersionLabel({}), '');
  assert.equal(getGirderVersionLabel(null), '');
});

test('INVALID_GIRDER_API_URL_MESSAGE is the unified check failure copy', () => {
  assert.equal(INVALID_GIRDER_API_URL_MESSAGE, 'Not a valid Digital Slide Archive (DSA) API URL');
});
