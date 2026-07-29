export function isLoginPageUrl(url) {
    if (!url) return false;
    try {
        const u = new URL(url);
        return u.pathname.endsWith('/Login.php');
    } catch {
        return false;
    }
}

export function looksLikeLoginHtml(data) {
    if (typeof data !== 'string') return false;
    const lower = data.toLowerCase();
    return lower.includes('/login.php')
        || lower.includes('name="user"')
        || lower.includes("name='user'")
        || (lower.includes('<form') && lower.includes('password'));
}

export function looksLikeWelcomeHtml(data) {
    if (typeof data !== 'string') return false;
    const lower = data.toLowerCase();
    return lower.includes('eslidemananager - welcome')
        || lower.includes('systemparms.sessionmode');
}

export function looksLikeTableHtml(data) {
    if (typeof data !== 'string') return false;
    const lower = data.toLowerCase();
    return lower.includes('eslidemananager - table')
        || lower.includes('systemparms.sessionmode');
}

export function getResponseFinalUrl(response) {
    return response?.request?.res?.responseUrl
        || response?.request?.responseURL
        || response?.config?.url
        || '';
}

function esmPayloadErrorMessage(data, fallback = 'eSlideManager request failed') {
    if (!data) return fallback;
    if (typeof data === 'string') return data.slice(0, 500) || fallback;
    if (data.Alert) return String(data.Alert);
    if (data.Warning) return String(data.Warning);
    if (data.message) return String(data.message);
    if (data.Message) return String(data.Message);
    if (data.error) return String(data.error);
    return fallback;
}

/** True when Electron/net error looks like the host could not be reached. */
export function isEsmUnreachableError(raw) {
    const text = [
        raw?.code,
        raw?.errno,
        raw?.message,
        typeof raw === 'string' ? raw : null,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    if (!text) return false;
    return (
        /err_connection_refused|err_connection_reset|err_connection_timed_out|err_connection_closed/.test(text)
        || /err_name_not_resolved|err_address_unreachable|err_internet_disconnected|err_network_changed/.test(text)
        || /err_timed_out|etimedout|econnrefused|enotfound|econnreset|eai_again|enetunreach/.test(text)
        || /failed to fetch|network error|socket hang up|getaddrinfo/.test(text)
    );
}

/**
 * Normalize login IPC / catch errors for the login card.
 * @param {string|{ message?: string, code?: string }|Error|null|undefined} raw
 * @param {string} [requestBase] - Profile URL (or proxy) to open in a browser when unreachable
 * @returns {{ message: string, openUrl: string|null, kind: 'unreachable'|'generic' }}
 */
export function formatEsmLoginFailure(raw, requestBase = '') {
    const message =
        (raw && typeof raw === 'object' && raw.message != null)
            ? String(raw.message)
            : (raw != null ? String(raw) : 'Login failed');
    const openUrl = String(requestBase || '').trim() || null;
    if (isEsmUnreachableError(raw) || isEsmUnreachableError(message)) {
        return {
            kind: 'unreachable',
            openUrl,
            message: openUrl
                ? "Couldn't reach the eSlide Manager server. Check the profile URL and that the server is running. "
                    + 'Open the link below in a browser to help diagnose the problem.'
                : "Couldn't reach the eSlide Manager server. Check the profile URL and that the server is running.",
        };
    }
    return {
        kind: 'generic',
        openUrl: null,
        message: message || 'Login failed',
    };
}

/**
 * Login steps (authenticate, DetermineHierarchy) may return HTML post-auth pages.
 * Success means not redirected back to Login.php and HTTP status < 400.
 * @returns {{ ok: true } | { loginRequired: true } | { error: string }}
 */
export function validateLoginStepResponse(response, stepLabel) {
    const data = response?.data;
    const status = response?.status ?? 0;
    const finalUrl = getResponseFinalUrl(response);

    if (status >= 400) {
        return {
            error: `${stepLabel} failed (${status}): ${esmPayloadErrorMessage(data, 'HTTP error')}`,
        };
    }
    if (isLoginPageUrl(finalUrl) || looksLikeLoginHtml(data)) {
        return { loginRequired: true };
    }
    return { ok: true };
}

/**
 * Records_List submits search criteria and returns an HTML Table shell (not JSON).
 * Success means session is active — same rules as login steps, plus eSM Alert objects.
 * @returns {{ ok: true } | { loginRequired: true } | { error: string }}
 */
export function validateRecordsListSetupResponse(response) {
    const data = response?.data;
    const stepCheck = validateLoginStepResponse(response, 'Records_List');
    if (stepCheck.error || stepCheck.loginRequired) {
        return stepCheck;
    }
    if (data && typeof data === 'object' && data.Alert) {
        return { error: String(data.Alert) };
    }
    return { ok: true };
}
