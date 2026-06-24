function normalizeEsmBaseUrl(url) {
    const t = String(url ?? '').trim();
    if (!t) return '';
    return t.replace(/\/$/, '');
}

/**
 * Rewrite eSM redirect targets for relay/proxy access.
 * - Canonical host → under relay prefix
 * - Same relay host with path outside prefix → prepend relay path
 *
 * @param {string} redirectUrl
 * @param {string} [currentUrl]
 * @param {string} canonicalBase
 * @param {string} proxyBase
 * @returns {string}
 */
export function rewriteRelayRedirectUrl(redirectUrl, currentUrl, canonicalBase, proxyBase) {
    const canonical = normalizeEsmBaseUrl(canonicalBase);
    const proxy = normalizeEsmBaseUrl(proxyBase);
    if (!proxy || !redirectUrl) return redirectUrl;

    try {
        const target = new URL(redirectUrl, currentUrl || proxy);
        const canonicalOrigin = new URL(canonical).origin;
        const relay = new URL(proxy);
        const relayPath = relay.pathname.replace(/\/$/, '');
        const targetPath = target.pathname.startsWith('/') ? target.pathname : `/${target.pathname}`;

        if (target.origin === canonicalOrigin) {
            return `${relay.origin}${relayPath}${targetPath}${target.search}${target.hash}`;
        }

        if (target.origin === relay.origin && relayPath) {
            const underPrefix = targetPath === relayPath || targetPath.startsWith(`${relayPath}/`);
            if (!underPrefix) {
                return `${relay.origin}${relayPath}${targetPath}${target.search}${target.hash}`;
            }
        }

        return target.href;
    } catch {
        return redirectUrl;
    }
}
