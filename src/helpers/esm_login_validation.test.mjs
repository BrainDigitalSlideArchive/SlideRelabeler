import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
    isLoginPageUrl,
    looksLikeLoginHtml,
    looksLikeTableHtml,
    looksLikeWelcomeHtml,
    validateLoginStepResponse,
    validateRecordsListSetupResponse,
    isEsmUnreachableError,
    formatEsmLoginFailure,
} from './esm_login_validation.js';

const WELCOME_HTML = `<!DOCTYPE HTML>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><TITLE>eSlideManager - Welcome</TITLE>
<script>var SystemParms = window.SystemParms = {}; SystemParms.SessionMode = "RUO";</script>
</head>
<body></body>
</html>`;

const LOGIN_HTML = `<!DOCTYPE HTML>
<html>
<head><TITLE>eSlideManager - Login</TITLE></head>
<body>
<form action="/authenticate.php">
<input name="user" type="text" />
<input name="password" type="password" />
</form>
</body>
</html>`;

const TABLE_HTML = `<!DOCTYPE HTML>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><TITLE>eSlideManager - Table</TITLE>
<script>var SystemParms = window.SystemParms = {}; SystemParms.SessionMode = "RUO";</script>
</head>
<body></body>
</html>`;

const ERROR_HTML = `<!DOCTYPE html>
<html><head><title>Error</title></head>
<body><pre>Cannot GET /Disclaimer.php</pre></body>
</html>`;

function mockResponse({ status = 200, data = '', finalUrl = 'https://example.com/page' } = {}) {
    return {
        status,
        data,
        request: { res: { responseUrl: finalUrl } },
        config: { url: finalUrl },
    };
}

describe('looksLikeWelcomeHtml', () => {
    it('detects eSM Welcome page HTML', () => {
        assert.equal(looksLikeWelcomeHtml(WELCOME_HTML), true);
    });

    it('does not match login form HTML', () => {
        assert.equal(looksLikeWelcomeHtml(LOGIN_HTML), false);
    });
});

describe('looksLikeTableHtml', () => {
    it('detects eSM Table page HTML', () => {
        assert.equal(looksLikeTableHtml(TABLE_HTML), true);
    });

    it('does not match login form HTML', () => {
        assert.equal(looksLikeTableHtml(LOGIN_HTML), false);
    });
});

describe('validateRecordsListSetupResponse', () => {
    it('accepts Table HTML from Records_List', () => {
        const result = validateRecordsListSetupResponse(
            mockResponse({
                data: TABLE_HTML,
                finalUrl: 'https://relay.example.com/esm/Records_List.php',
            }),
        );
        assert.deepEqual(result, { ok: true });
    });

    it('rejects login form HTML', () => {
        const result = validateRecordsListSetupResponse(
            mockResponse({
                data: LOGIN_HTML,
                finalUrl: 'https://esm.example.com/Login.php',
            }),
        );
        assert.deepEqual(result, { loginRequired: true });
    });

    it('rejects HTTP 404 HTML error pages', () => {
        const result = validateRecordsListSetupResponse(
            mockResponse({
                status: 404,
                data: ERROR_HTML,
                finalUrl: 'https://relay.example.com/Records_List.php',
            }),
        );
        assert.equal(result.error?.includes('Records_List failed (404)'), true);
    });

    it('rejects eSM Alert objects', () => {
        const result = validateRecordsListSetupResponse(
            mockResponse({
                data: { Alert: 'Search not permitted' },
                finalUrl: 'https://esm.example.com/Records_List.php',
            }),
        );
        assert.deepEqual(result, { error: 'Search not permitted' });
    });
});

describe('validateLoginStepResponse', () => {
    it('accepts Welcome HTML from DetermineHierarchy', () => {
        const result = validateLoginStepResponse(
            mockResponse({
                data: WELCOME_HTML,
                finalUrl: 'https://relay.example.com/esm/Welcome.php',
            }),
            'DetermineHierarchy',
        );
        assert.deepEqual(result, { ok: true });
    });

    it('rejects login form HTML', () => {
        const result = validateLoginStepResponse(
            mockResponse({
                data: LOGIN_HTML,
                finalUrl: 'https://esm.example.com/Login.php',
            }),
            'authenticate',
        );
        assert.deepEqual(result, { loginRequired: true });
    });

    it('rejects HTTP 404 HTML error pages', () => {
        const result = validateLoginStepResponse(
            mockResponse({
                status: 404,
                data: ERROR_HTML,
                finalUrl: 'https://relay.example.com/Disclaimer.php',
            }),
            'authenticate',
        );
        assert.equal(result.error?.includes('authenticate failed (404)'), true);
    });

    it('rejects Login.php final URL even with empty body', () => {
        const result = validateLoginStepResponse(
            mockResponse({
                data: '',
                finalUrl: 'https://esm.example.com/Login.php?ErrorString=bad',
            }),
            'authenticate',
        );
        assert.deepEqual(result, { loginRequired: true });
    });
});

describe('isLoginPageUrl', () => {
    it('matches Login.php paths', () => {
        assert.equal(isLoginPageUrl('https://esm.example.com/Login.php'), true);
        assert.equal(isLoginPageUrl('https://relay.example.com/esm/Login.php'), true);
        assert.equal(isLoginPageUrl('https://esm.example.com/Welcome.php'), false);
    });
});

describe('isEsmUnreachableError', () => {
    it('detects Electron net connection errors', () => {
        assert.equal(isEsmUnreachableError({ message: 'net::ERR_CONNECTION_REFUSED' }), true);
        assert.equal(isEsmUnreachableError({ code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND' }), true);
        assert.equal(isEsmUnreachableError({ message: 'Login failed' }), false);
    });
});

describe('formatEsmLoginFailure', () => {
    it('returns friendly unreachable copy with openUrl', () => {
        const result = formatEsmLoginFailure(
            { message: 'net::ERR_CONNECTION_REFUSED' },
            'https://esm.example.com',
        );
        assert.equal(result.kind, 'unreachable');
        assert.equal(result.openUrl, 'https://esm.example.com');
        assert.match(result.message, /Couldn't reach the eSlide Manager server/);
        assert.match(result.message, /Open the link below/);
    });

    it('keeps auth failures as generic without openUrl', () => {
        const result = formatEsmLoginFailure('Invalid username or password', 'https://esm.example.com');
        assert.equal(result.kind, 'generic');
        assert.equal(result.openUrl, null);
        assert.equal(result.message, 'Invalid username or password');
    });
});
