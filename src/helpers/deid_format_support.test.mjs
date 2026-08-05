import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  getRowDeidFormat,
  isRowUnsupportedForDeid,
  liftDeidFormatFromMetadataReply,
  shouldSkipUnsupportedRow,
} from './deid_format_support.js';

const copyOn = { copy: { enable_copy_mode: true } };
const copyOff = { copy: { enable_copy_mode: false } };

function row(reserved) {
  return { __reserved: reserved };
}

describe('liftDeidFormatFromMetadataReply', () => {
  it('lifts an explicit vendor format', () => {
    const reserved = { metadata: { deid_format: 'aperio', sizeX: 1 } };
    liftDeidFormatFromMetadataReply(reserved);
    assert.equal(reserved.deid_format, 'aperio');
  });

  it('lifts empty string as unsupported', () => {
    const reserved = { metadata: { deid_format: '' } };
    liftDeidFormatFromMetadataReply(reserved);
    assert.equal(reserved.deid_format, '');
  });

  it('leaves deid_format unset when the key is missing (fail open)', () => {
    const reserved = { metadata: { sizeX: 100 } };
    liftDeidFormatFromMetadataReply(reserved);
    assert.equal(Object.prototype.hasOwnProperty.call(reserved, 'deid_format'), false);
  });

  it('leaves deid_format unset when metadata is missing', () => {
    const reserved = { bytes: 1 };
    liftDeidFormatFromMetadataReply(reserved);
    assert.equal(Object.prototype.hasOwnProperty.call(reserved, 'deid_format'), false);
  });
});

describe('getRowDeidFormat', () => {
  it('reads the lifted value, then the metadata payload', () => {
    assert.equal(getRowDeidFormat(row({ deid_format: 'aperio' })), 'aperio');
    assert.equal(getRowDeidFormat(row({ metadata: { deid_format: 'philips' } })), 'philips');
  });

  it('returns null when the backend never reported one', () => {
    assert.equal(getRowDeidFormat(row({})), null);
    assert.equal(getRowDeidFormat(undefined), null);
  });
});

describe('isRowUnsupportedForDeid', () => {
  it('only an explicit empty string means unsupported', () => {
    assert.equal(isRowUnsupportedForDeid(row({ deid_format: '' })), true);
    assert.equal(isRowUnsupportedForDeid(row({ deid_format: 'czi' })), false);
    assert.equal(isRowUnsupportedForDeid(row({})), false);
  });
});

describe('shouldSkipUnsupportedRow', () => {
  it('skips unsupported slides when de-identifying', () => {
    assert.equal(shouldSkipUnsupportedRow(row({ deid_format: '' }), copyOff), true);
  });

  it('lets unsupported slides through in copy mode', () => {
    assert.equal(shouldSkipUnsupportedRow(row({ deid_format: '' }), copyOn), false);
  });

  it('never skips supported or unknown rows', () => {
    assert.equal(shouldSkipUnsupportedRow(row({ deid_format: 'aperio' }), copyOff), false);
    assert.equal(shouldSkipUnsupportedRow(row({}), copyOff), false);
    assert.equal(shouldSkipUnsupportedRow(row({}), undefined), false);
  });
});
