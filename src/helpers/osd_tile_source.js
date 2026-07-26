/**
 * Map large_image getMetadata() fields onto an OpenSeadragon custom TileSource.
 *
 * large_image and OSD both use level 0 = lowest resolution, levels-1 = full res.
 * Prefer tileWidth/tileHeight (never tileSize) so non-square tiles stay correct.
 */

/**
 * Accept a plain number or a protobuf Struct Value wrapper `{ numberValue }`.
 * @param {unknown} value
 * @returns {number|null}
 */
export function unwrapMetaNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (value && typeof value === 'object' && typeof value.numberValue === 'number'
      && Number.isFinite(value.numberValue)) {
    return value.numberValue;
  }
  return null;
}

/**
 * @param {object|null|undefined} metadata - GetMetadata `metadata` (Struct fields or plain object)
 * @returns {{ sizeX: number, sizeY: number, tileWidth: number, tileHeight: number, levels: number }|null}
 */
export function readSlideTileMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  const source = (metadata.fields && typeof metadata.fields === 'object')
    ? metadata.fields
    : metadata;

  const sizeX = unwrapMetaNumber(source.sizeX);
  const sizeY = unwrapMetaNumber(source.sizeY);
  const tileWidth = unwrapMetaNumber(source.tileWidth);
  const tileHeight = unwrapMetaNumber(source.tileHeight);
  const levels = unwrapMetaNumber(source.levels);

  if (sizeX == null || sizeY == null || tileWidth == null || tileHeight == null || levels == null) {
    return null;
  }
  if (sizeX <= 0 || sizeY <= 0 || tileWidth <= 0 || tileHeight <= 0 || levels < 1) {
    return null;
  }

  return { sizeX, sizeY, tileWidth, tileHeight, levels };
}

/**
 * Build OpenSeadragon custom TileSource options from large_image metadata.
 * Does not set `tileSize` (that forces square tiles in OSD).
 *
 * @param {string} file
 * @param {{ sizeX: number, sizeY: number, tileWidth: number, tileHeight: number, levels: number }} meta
 */
export function makeWsiTileSource(file, meta) {
  return {
    name: file,
    width: meta.sizeX,
    height: meta.sizeY,
    tileWidth: meta.tileWidth,
    tileHeight: meta.tileHeight,
    tileOverlap: 0,
    minLevel: 0,
    maxLevel: meta.levels - 1,
    getTileUrl(level, x, y) {
      return `tile://` + encodeURIComponent(`${file}|${level}|${x}|${y}`);
    },
  };
}
