import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDsaItemMetadata,
  isDsaItemMetadataEnabled,
  topLevelDataColumns,
} from './dsa_upload_metadata.js';

describe('isDsaItemMetadataEnabled', () => {
  it('is false for none and missing', () => {
    assert.equal(isDsaItemMetadataEnabled({ mode: 'none' }), false);
    assert.equal(isDsaItemMetadataEnabled({}), false);
    assert.equal(isDsaItemMetadataEnabled(undefined), false);
  });

  it('is true for all modes', () => {
    assert.equal(isDsaItemMetadataEnabled({ mode: 'all_deid' }), true);
    assert.equal(isDsaItemMetadataEnabled({ mode: 'all_original' }), true);
  });

  it('requires a column for column mode', () => {
    assert.equal(isDsaItemMetadataEnabled({ mode: 'column', column: '' }), false);
    assert.equal(isDsaItemMetadataEnabled({ mode: 'column', column: 'meta' }), true);
  });
});

describe('buildDsaItemMetadata', () => {
  const row = {
    BlockId: 'B1',
    StainId: 'HE',
    path: '/orig/slide.svs',
    nested: { a: 1 },
    __reserved: {
      source: { filename: 'slide.svs', path: '/orig/slide.svs' },
      uuid: 'u-1',
      labelText: 'Label',
      rename: 'out-name',
    },
  };

  it('returns null for none', () => {
    assert.equal(buildDsaItemMetadata(row, { mode: 'none' }), null);
  });

  it('all_deid copies data columns and excludes path column and convention fields', () => {
    const meta = buildDsaItemMetadata(row, { mode: 'all_deid' }, { file_path_column: 'path' });
    assert.deepEqual(meta, { BlockId: 'B1', StainId: 'HE' });
    assert.equal(meta.uuid, undefined);
    assert.equal(meta.InputFileName, undefined);
    assert.equal(meta.labelText, undefined);
    assert.equal(meta.originalFileName, undefined);
  });

  it('all_original adds originalFileName', () => {
    const meta = buildDsaItemMetadata(row, { mode: 'all_original' }, { file_path_column: 'path' });
    assert.equal(meta.BlockId, 'B1');
    assert.equal(meta.originalFileName, 'slide.svs');
    assert.equal(meta.path, undefined);
  });

  it('column mode skips when column empty', () => {
    assert.equal(buildDsaItemMetadata(row, { mode: 'column', column: '' }), null);
  });

  it('column mode stores plain string under column key', () => {
    assert.deepEqual(
      buildDsaItemMetadata(row, { mode: 'column', column: 'BlockId' }),
      { BlockId: 'B1' },
    );
  });

  it('column mode merges JSON object at root', () => {
    const withJson = { ...row, payload: '{"a":1,"b":"x"}' };
    assert.deepEqual(
      buildDsaItemMetadata(withJson, { mode: 'column', column: 'payload' }),
      { a: 1, b: 'x' },
    );
  });

  it('column mode stores JSON array under column key', () => {
    const withJson = { ...row, payload: '[1,2]' };
    assert.deepEqual(
      buildDsaItemMetadata(withJson, { mode: 'column', column: 'payload' }),
      { payload: [1, 2] },
    );
  });

  it('column mode treats invalid JSON as string', () => {
    const withJson = { ...row, payload: '{not-json' };
    assert.deepEqual(
      buildDsaItemMetadata(withJson, { mode: 'column', column: 'payload' }),
      { payload: '{not-json' },
    );
  });
});

describe('topLevelDataColumns', () => {
  it('skips __ keys and objects', () => {
    assert.deepEqual(
      topLevelDataColumns({ a: 1, __x: 2, obj: { z: 1 } }),
      { a: '1' },
    );
  });
});
