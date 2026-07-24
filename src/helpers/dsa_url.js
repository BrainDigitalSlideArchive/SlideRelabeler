// helpers/dsa_url.js — display helpers for DSA / Girder API URLs.

/** User-facing message when a DSA URL check fails for any reason. */
export const INVALID_GIRDER_API_URL_MESSAGE = 'Not a valid Digital Slide Archive (DSA) API URL';

/**
 * Strip trailing /api/v1 (and optional slash) for human-readable base URL display.
 * @param {string} apiUrl
 * @returns {string}
 */
export function formatDsaBaseUrl(apiUrl) {
  if (apiUrl == null) return '';
  let url = String(apiUrl).trim();
  if (!url) return '';
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/api\/v1$/i, '');
  return url.replace(/\/+$/, '');
}

/**
 * Whether a JSON body looks like Girder's GET /system/version response.
 * Girder ≥3 uses `release`; older Girder uses `apiVersion`.
 * @param {unknown} body
 * @returns {boolean}
 */
export function isGirderVersionResponse(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  return (
    body.release != null
    || body.apiVersion != null
    || body.api != null
    || body.version != null
  );
}

/**
 * Human-readable version string from a Girder /system/version body.
 * Prefer release → apiVersion → api → version.
 * @param {unknown} body
 * @returns {string}
 */
export function getGirderVersionLabel(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return '';
  const candidates = [body.release, body.apiVersion, body.api, body.version];
  for (const value of candidates) {
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
}
