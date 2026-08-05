// helpers/deid_format_support.js — can this row be de-identified at all?
//
// The backend reports `deid_format` with each slide's metadata: a vendor name
// when the file carries metadata to de-identify, or '' when it opens fine but
// has none (e.g. a slide converted to plain pyramidal TIFF). Rows loaded before
// this existed have no value at all, which stays permissive.

/**
 * Lift deid_format from a GetMetadata reply onto reserved fields.
 * Only sets the key when the decoded metadata object includes it (fail open).
 *
 * @param {object} reservedMerged — file_row.__reserved merged with the reply
 * @returns {object} same object, optionally with deid_format set
 */
export function liftDeidFormatFromMetadataReply(reservedMerged) {
  const meta = reservedMerged?.metadata;
  if (meta && Object.prototype.hasOwnProperty.call(meta, 'deid_format')) {
    reservedMerged.deid_format =
      meta.deid_format == null ? '' : String(meta.deid_format);
  }
  return reservedMerged;
}

export function getRowDeidFormat(file_row) {
  const reserved = file_row?.__reserved ?? {};
  const value = reserved.deid_format ?? reserved.metadata?.deid_format;
  return value == null ? null : String(value);
}

/**
 * True only when the backend explicitly reported "no vendor metadata".
 */
export function isRowUnsupportedForDeid(file_row) {
  return getRowDeidFormat(file_row) === '';
}

/**
 * Copy mode delivers the source bytes untouched, so it needs no vendor handler.
 */
export function shouldSkipUnsupportedRow(file_row, config) {
  if (config?.copy?.enable_copy_mode) return false;
  return isRowUnsupportedForDeid(file_row);
}
