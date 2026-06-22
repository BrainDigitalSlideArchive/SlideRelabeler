import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildThumbnailProtocolUrl,
  canShowEmbeddedThumbnail,
  sourceFilenameCellValue,
} from './thumbnail_helpers.js';

describe('canShowEmbeddedThumbnail', () => {
  it('returns true when path and thumbnail associated image exist', () => {
    assert.equal(
      canShowEmbeddedThumbnail({
        source: { path: '/a.svs' },
        associatedImages: ['thumbnail', 'label'],
      }),
      true,
    );
  });

  it('returns false without thumbnail in associatedImages', () => {
    assert.equal(
      canShowEmbeddedThumbnail({
        source: { path: '/a.svs' },
        associatedImages: ['label'],
      }),
      false,
    );
  });
});

describe('sourceFilenameCellValue', () => {
  it('changes when bytes or associatedImages update', () => {
    const before = sourceFilenameCellValue({
      source: { filename: 'a.svs' },
      bytes: 0,
      associatedImages: [],
    });
    const after = sourceFilenameCellValue({
      source: { filename: 'a.svs' },
      bytes: 123,
      associatedImages: ['thumbnail'],
    });
    assert.notEqual(before, after);
  });

  it('changes when error is set on the row', () => {
    const before = sourceFilenameCellValue({
      source: { filename: 'a.svs' },
      bytes: 0,
      associatedImages: [],
    });
    const after = sourceFilenameCellValue({
      source: { filename: 'a.svs' },
      bytes: 0,
      associatedImages: [],
      error: 'Cannot open slide',
    });
    assert.notEqual(before, after);
  });
});

describe('buildThumbnailProtocolUrl', () => {
  it('encodes the source path', () => {
    assert.equal(
      buildThumbnailProtocolUrl('/Users/Tom/a.svs'),
      'thumbnail://%2FUsers%2FTom%2Fa.svs',
    );
  });
});
