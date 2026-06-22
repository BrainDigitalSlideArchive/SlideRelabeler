// helpers/dsa_upload_metadata.js — map file row to Girder meta.deidUpload (WSI DeID conventions).

import { return_filename_basename_from_filename } from './renderer_path_helpers.js';

function topLevelMetadata(fileRow) {
  const out = {};
  if (!fileRow || typeof fileRow !== 'object') return out;
  for (const key of Object.keys(fileRow)) {
    if (key.startsWith('__')) continue;
    const val = fileRow[key];
    if (val !== null && val !== undefined && typeof val !== 'object') {
      out[key] = String(val);
    }
  }
  return out;
}

/**
 * @param {object} fileRow
 * @returns {Record<string, string>}
 */
export function buildDeidUploadMetadata(fileRow) {
  const reserved = fileRow?.__reserved ?? {};
  const source = reserved.source ?? {};
  const uuid = reserved.uuid ?? '';
  const ext = source.parsed?.ext || '';
  const uuidBasename = uuid
    ? `${uuid}${ext}`
    : return_filename_basename_from_filename(source.filename || source.path || '');

  const meta = {
    ...topLevelMetadata(fileRow),
    uuid: String(uuid),
    InputFileName: uuidBasename,
  };

  const tokenId = fileRow.TokenID ?? fileRow.deid ?? '';
  if (tokenId) meta.TokenID = String(tokenId);

  const imageId =
    reserved.dsaAlias ||
    reserved.labelText ||
    reserved.rename ||
    '';
  if (imageId) meta.ImageID = String(imageId);

  if (reserved.labelText) meta.labelText = String(reserved.labelText);
  if (reserved.qrPayload) meta.qrPayload = String(reserved.qrPayload);

  return meta;
}
