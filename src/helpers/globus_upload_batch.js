/**
 * Globus upload batch size helpers.
 * null = whole run then one transfer; integer >= 1 = batch size (1 = ASAP single-file).
 */

/**
 * @param {unknown} raw
 * @returns {null|number} null = unlimited (whole run); number >= 1
 */
export function resolveMaxUploadBatchSize(raw) {
  if (raw === null || raw === '') return null;
  if (raw === undefined) return 1;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

/**
 * Normalize UI/onChange value into stored config shape.
 * Empty string → null; invalid → 1; otherwise integer >= 1.
 * @param {unknown} value
 * @returns {null|number}
 */
export function parseMaxUploadBatchSizeInput(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const n = parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

/**
 * Quote a path for Globus CLI --batch line when it contains whitespace.
 * @param {string} path
 * @returns {string}
 */
export function quoteGlobusBatchPath(path) {
  const p = String(path ?? '');
  if (!p) return '""';
  if (/[\s"]/.test(p)) {
    return `"${p.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return p;
}

/**
 * Build stdin body for `globus transfer … --batch -`
 * @param {{ sourcePath: string, destPath: string }[]} pairs
 * @returns {string}
 */
export function buildGlobusBatchStdin(pairs) {
  return (pairs || [])
    .map((pair) => `${quoteGlobusBatchPath(pair.sourcePath)} ${quoteGlobusBatchPath(pair.destPath)}`)
    .join('\n') + ((pairs || []).length ? '\n' : '');
}

/** Run-scoped deferred Globus uploads (not persisted). */
let deferredGlobusUploads = [];

export function clearDeferredGlobusUploads() {
  deferredGlobusUploads = [];
}

export function getDeferredGlobusUploadCount() {
  return deferredGlobusUploads.length;
}

export function pushDeferredGlobusUpload(item) {
  deferredGlobusUploads.push(item);
}

/**
 * Remove and return up to `n` deferred items (or all if n is null/undefined).
 * @param {number|null|undefined} n
 */
export function takeDeferredGlobusUploads(n) {
  if (n == null || !Number.isFinite(n) || n >= deferredGlobusUploads.length) {
    const all = deferredGlobusUploads;
    deferredGlobusUploads = [];
    return all;
  }
  return deferredGlobusUploads.splice(0, n);
}
