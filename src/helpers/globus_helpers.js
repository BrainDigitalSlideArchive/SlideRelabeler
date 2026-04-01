/** Globus endpoint / collection UUID (variant bits per RFC 4122). */
export const GLOBUS_ENDPOINT_UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isGlobusEndpointUuid(value) {
    if (value == null || typeof value !== 'string') return false;
    return GLOBUS_ENDPOINT_UUID_RE.test(value.trim());
}
