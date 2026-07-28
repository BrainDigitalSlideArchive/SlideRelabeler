import test from 'node:test';
import assert from 'node:assert/strict';
import {
  unwrapMetaNumber,
  readSlideTileMetadata,
  makeWsiTileSource,
} from './osd_tile_source.js';

/** Mirror OpenSeadragon tile-count math at a given pyramid level. */
function osdTileCount(imageSize, tileSize, level, maxLevel) {
  const scale = 1 / (2 ** (maxLevel - level));
  const dim = Math.ceil(imageSize * scale);
  return Math.ceil(dim / tileSize);
}

test('unwrapMetaNumber accepts plain numbers and protobuf numberValue', () => {
  assert.equal(unwrapMetaNumber(3840), 3840);
  assert.equal(unwrapMetaNumber({ numberValue: 256 }), 256);
  assert.equal(unwrapMetaNumber(null), null);
  assert.equal(unwrapMetaNumber({}), null);
  assert.equal(unwrapMetaNumber('3840'), null);
});

test('readSlideTileMetadata reads protobuf Struct fields shape', () => {
  const meta = readSlideTileMetadata({
    fields: {
      sizeX: { numberValue: 3840 },
      sizeY: { numberValue: 2160 },
      tileWidth: { numberValue: 3840 },
      tileHeight: { numberValue: 256 },
      levels: { numberValue: 5 },
    },
  });
  assert.deepEqual(meta, {
    sizeX: 3840,
    sizeY: 2160,
    tileWidth: 3840,
    tileHeight: 256,
    levels: 5,
  });
});

test('readSlideTileMetadata reads plain object metadata', () => {
  const meta = readSlideTileMetadata({
    sizeX: 1024,
    sizeY: 768,
    tileWidth: 256,
    tileHeight: 256,
    levels: 3,
  });
  assert.deepEqual(meta, {
    sizeX: 1024,
    sizeY: 768,
    tileWidth: 256,
    tileHeight: 256,
    levels: 3,
  });
});

test('makeWsiTileSource maps non-square large_image meta without tileSize', () => {
  const meta = {
    sizeX: 3840,
    sizeY: 2160,
    tileWidth: 3840,
    tileHeight: 256,
    levels: 5,
  };
  const source = makeWsiTileSource('/tmp/ceres.tif', meta);

  assert.equal(source.width, 3840);
  assert.equal(source.height, 2160);
  assert.equal(source.tileWidth, 3840);
  assert.equal(source.tileHeight, 256);
  assert.equal(source.minLevel, 0);
  assert.equal(source.maxLevel, 4);
  assert.equal(source.tileOverlap, 0);
  assert.equal(Object.hasOwn(source, 'tileSize'), false);

  const url = source.getTileUrl(4, 0, 8);
  assert.match(url, /^tile:\/\//);
  const decoded = decodeURIComponent(url.slice('tile://'.length));
  assert.equal(decoded, '/tmp/ceres.tif|4|0|8');
});

test('makeWsiTileSource maps square WSI tiles without tileSize', () => {
  const source = makeWsiTileSource('/tmp/slide.svs', {
    sizeX: 4096,
    sizeY: 4096,
    tileWidth: 256,
    tileHeight: 256,
    levels: 5,
  });
  assert.equal(source.tileWidth, 256);
  assert.equal(source.tileHeight, 256);
  assert.equal(Object.hasOwn(source, 'tileSize'), false);
});

test('non-square tile dims match large_image grid; square tileSize would not', () => {
  const sizeX = 3840;
  const sizeY = 2160;
  const tileWidth = 3840;
  const tileHeight = 256;
  const levels = 5;
  const maxLevel = levels - 1;

  const nx = osdTileCount(sizeX, tileWidth, maxLevel, maxLevel);
  const ny = osdTileCount(sizeY, tileHeight, maxLevel, maxLevel);
  assert.equal(nx, 1);
  assert.equal(ny, 9);

  // Old bug: tileSize: tileWidth forced square 3840x3840 → only 1x1 at every level
  const wrongNy = osdTileCount(sizeY, tileWidth, maxLevel, maxLevel);
  assert.equal(wrongNy, 1);
  assert.notEqual(ny, wrongNy);
});
