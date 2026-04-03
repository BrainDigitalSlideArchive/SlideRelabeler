/** Globus endpoint / collection UUID (variant bits per RFC 4122). */
export const GLOBUS_ENDPOINT_UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isGlobusEndpointUuid(value) {
    if (value == null || typeof value !== 'string') return false;
    return GLOBUS_ENDPOINT_UUID_RE.test(value.trim());
}

/** Normalize endpoint collection path to `uuid:/path/` for comparisons (matches tree / listDirectory). */
export function normalizeGlobusCollectionPath(pathValue) {
    const raw = (pathValue || '').trim();
    if (!raw || !raw.includes(':')) return '';
    const [endpointId, ...rest] = raw.split(':');
    const cleanEndpointId = (endpointId || '').trim();
    let endpointPath = rest.join(':').trim() || '/';
    if (!endpointPath.startsWith('/')) endpointPath = '/' + endpointPath;
    if (!endpointPath.endsWith('/')) endpointPath += '/';
    return `${cleanEndpointId}:${endpointPath}`;
}

/** True if `collectionPath` is the endpoint root `endpointId:/` (normalized). */
export function isGlobusEndpointRootPath(collectionPath, endpointId) {
    const id = (endpointId || '').trim();
    if (!id) return false;
    const norm = normalizeGlobusCollectionPath(collectionPath);
    const root = normalizeGlobusCollectionPath(`${id}:/`);
    return norm === root;
}

/** Human-readable path after `endpointId:` (no UUID on the primary line). */
export function displayPathWithoutEndpointUuid(collectionPath) {
    const raw = (collectionPath || '').trim();
    if (!raw || !raw.includes(':')) return '';
    const idx = raw.indexOf(':');
    let tail = raw.slice(idx + 1).trim() || '/';
    if (!tail.startsWith('/')) tail = '/' + tail;
    tail = tail.replace(/\/+$/, '') || '/';
    if (tail === '/') return 'Root (/)';
    return tail;
}
