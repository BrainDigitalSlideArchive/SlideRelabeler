import { net } from 'electron';
import { XMLParser } from "fast-xml-parser";
import { rewriteRelayRedirectUrl } from '../helpers/esm_relay_redirect.js';
import {
    getResponseFinalUrl,
    isLoginPageUrl,
    validateLoginStepResponse,
    validateRecordsListSetupResponse,
} from '../helpers/esm_login_validation.js';

function toStr(v) {
    if (v === null || v === undefined) return '';
    return String(v);
}

function normalizeEsmBaseUrl(url) {
    const t = String(url ?? '').trim();
    if (!t) return '';
    return t.replace(/\/$/, '');
}

function logLoginStepFailure(step, response, message) {
    console.error('eSlideManager login step failed:', {
        step,
        status: response?.status,
        finalUrl: getResponseFinalUrl(response),
        message,
    });
}

function logSearchStepFailure(step, response, message) {
    console.error('eSlideManager search step failed:', {
        step,
        status: response?.status,
        finalUrl: getResponseFinalUrl(response),
        contentType: response?.headers?.['content-type'],
        message,
    });
}

const MAX_AUTH_RETRIES = 1;

/**
 * True when eSM list payload indicates zero records (no Rows array).
 */
function indicatesZeroRecords(data) {
    if (!data || typeof data !== 'object') return false;
    const countKeys = ['TotalRecords', 'RecordCount', 'TotalRecordCount', 'totalRecords', 'recordCount'];
    for (const key of countKeys) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const n = Number(data[key]);
            if (!Number.isNaN(n) && n === 0) return true;
        }
    }
    if (data.Rows === null) return true;
    if (Array.isArray(data.Rows) && data.Rows.length === 0) return true;
    return false;
}

/**
 * True when payload looks like an error page, session expiry, or explicit error text.
 */
function looksLikeErrorPayload(data) {
    if (!data) return true;
    if (typeof data === 'string') {
        const s = data.toLowerCase();
        return s.includes('<html') || s.includes('login') || s.includes('error');
    }
    if (typeof data !== 'object') return false;
    if (data.Alert) return true;
    if (data.Warning) return true;
    if (data.error || data.Error || data.errorMessage) return true;
    const msg = toStr(data.message || data.Message);
    if (msg && /error|login|session|expired|denied/i.test(msg)) return true;
    return false;
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

function parseSlideRows(rows) {
    const fields = ['BlockId', 'StainId', 'BarcodeId', 'CompressedFileLocation', 'ScanDate'];
    return rows.map((row) => {
        const slide = fields.reduce((obj, field) => {
            obj[field] = row.Cells[field].Contents;
            return obj;
        }, {});
        slide.ImageId = row.Attributes.ImageIds;
        const slideNumMatch = slide.BarcodeId.match(/;s(\d+);/i);
        slide.SlideNum = slideNumMatch ? parseInt(slideNumMatch[1], 10) : null;
        slide.SlideId = row.Attributes.Ids;
        return slide;
    });
}

function parseFilteredRecordListResponse(response) {
    if (!response.data) {
        console.error('Response data is undefined. Status:', response.status);
        return Promise.reject({
            error: 'no_data',
            message: 'Invalid response: no data returned from eSlideManager.',
        });
    }

    const data = response.data;

    if (data.Rows) {
        if (!Array.isArray(data.Rows)) {
            console.error('Response data.Rows is not an array:', typeof data.Rows, data.Rows);
            return Promise.reject({
                error: 'invalid_rows',
                message: 'Invalid response: Rows is not an array.',
            });
        }
        return parseSlideRows(data.Rows);
    }

    if (indicatesZeroRecords(data)) {
        return [];
    }

    if (looksLikeErrorPayload(data)) {
        console.error('eSM response looks like an error payload:', data);
        logSearchStepFailure('GetFilteredRecordList', response, esmPayloadErrorMessage(data, 'eSlideManager returned an error. Try logging in again.'));
        return Promise.reject({
            error: 'error_payload',
            message: esmPayloadErrorMessage(data, 'eSlideManager returned an error. Try logging in again.'),
            data,
        });
    }

    console.warn('eSM response missing Rows; treating as empty result. Payload:', data);
    return [];
}

/**
 * Default browser-like headers for eSlideManager requests
 */
const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive'
};

/**
 * Promise-based wrapper for Electron's net.request
 * Automatically handles cookies via useSessionCookies
 * @param {Object} options - Request options
 * @param {string} options.method - HTTP method (GET, POST, etc.)
 * @param {string} options.url - Request URL
 * @param {Object} [options.headers] - Custom headers
 * @param {string} [options.data] - Request body data
 * @returns {Promise<Object>} Response object with status, headers, and data
 */
function makeRequest(options) {
    return new Promise((resolve, reject) => {
        const request = net.request({
            method: options.method || 'GET',
            url: options.url,
            useSessionCookies: true // Automatically handles cookies
        });
        
        // Merge custom headers with defaults
        const headers = { ...DEFAULT_HEADERS, ...(options.headers || {}) };
        Object.keys(headers).forEach(key => {
            request.setHeader(key, headers[key]);
        });
        
        // Write body for POST/PUT
        if (options.data && (options.method === 'POST' || options.method === 'PUT')) {
            request.write(options.data);
        }
        
        // Handle response
        let responseData = '';
        let responseHeaders = {};
        let statusCode = 0;
        let finalUrl = options.url;
        
        request.on('response', (response) => {
            statusCode = response.statusCode;
            finalUrl = response.url || options.url;
            
            // Collect headers (response.headers is read-only, so we read from it)
            const rawHeaders = response.headers || {};
            Object.keys(rawHeaders).forEach(key => {
                responseHeaders[key.toLowerCase()] = rawHeaders[key];
            });
            
            response.on('data', (chunk) => {
                responseData += chunk.toString();
            });
            
            response.on('end', () => {
                const contentType = responseHeaders['content-type'] || '';
                
                // Parse JSON if content-type indicates JSON
                let parsedData = responseData;
                if (contentType.includes('application/json')) {
                    try {
                        parsedData = JSON.parse(responseData);
                    } catch (e) {
                        // Keep as string if parsing fails
                    }
                }
                
                resolve({
                    status: statusCode,
                    statusText: response.statusMessage || 'OK',
                    headers: responseHeaders,
                    data: parsedData,
                    request: {
                        res: {
                            responseUrl: finalUrl
                        },
                        path: new URL(finalUrl).pathname
                    },
                    config: {
                        url: options.url
                    }
                });
            });
        });
        
        request.on('error', (error) => {
            console.error('eSlideManager request error:', error.message || error);
            reject(error);
        });
        
        request.end();
    });
}

const MAX_ESM_REDIRECTS = 10;

function buildNetResponse(finalUrl, originalUrl, statusCode, statusText, responseHeaders, responseData) {
    const contentType = responseHeaders['content-type'] || '';
    let parsedData = responseData;
    if (contentType.includes('application/json')) {
        try {
            parsedData = JSON.parse(responseData);
        } catch (e) {
            // keep string
        }
    }
    return {
        status: statusCode,
        statusText: statusText || 'OK',
        headers: responseHeaders,
        data: parsedData,
        request: {
            res: {
                responseUrl: finalUrl,
            },
            path: new URL(finalUrl).pathname,
        },
        config: {
            url: originalUrl,
        },
    };
}

/**
 * Relay-mode HTTP via net.request with manual redirect following and URL rewrite.
 */
function makeRelayRequest(client, options) {
    return new Promise((resolve, reject) => {
        const initialMethod = options.method || 'GET';
        const headers = { ...DEFAULT_HEADERS, ...(options.headers || {}) };
        const initialBody = options.data && (initialMethod === 'POST' || initialMethod === 'PUT')
            ? options.data
            : undefined;
        let hop = 0;
        let requestGeneration = 0;

        function startRequest(url, method, body) {
            const myGeneration = ++requestGeneration;
            const request = net.request({
                method: method || 'GET',
                url,
                redirect: 'manual',
                useSessionCookies: true,
            });

            Object.keys(headers).forEach((key) => {
                request.setHeader(key, headers[key]);
            });

            if (body && (method === 'POST' || method === 'PUT')) {
                request.write(body);
            }

            request.on('redirect', (statusCode, redirectMethod, redirectUrl) => {
                if (myGeneration !== requestGeneration) return;
                hop += 1;
                if (hop > MAX_ESM_REDIRECTS) {
                    request.abort();
                    reject(new Error('eSlideManager: too many redirects'));
                    return;
                }
                const rewritten = client.rewriteRelayRedirect(redirectUrl, url);
                request.abort();
                const nextBody = (redirectMethod === 'POST' || redirectMethod === 'PUT') ? body : undefined;
                startRequest(rewritten, redirectMethod, nextBody);
            });

            request.on('response', (response) => {
                if (myGeneration !== requestGeneration) return;

                const statusCode = response.statusCode;
                const finalUrl = response.url || url;
                let responseData = '';
                const responseHeaders = {};
                const rawHeaders = response.headers || {};
                Object.keys(rawHeaders).forEach((key) => {
                    responseHeaders[key.toLowerCase()] = rawHeaders[key];
                });

                if (statusCode >= 300 && statusCode < 400) {
                    const locationHeader = responseHeaders.location;
                    const location = Array.isArray(locationHeader) ? locationHeader[0] : locationHeader;
                    if (location) {
                        hop += 1;
                        if (hop > MAX_ESM_REDIRECTS) {
                            request.abort();
                            reject(new Error('eSlideManager: too many redirects'));
                            return;
                        }
                        const rewritten = client.rewriteRelayRedirect(location, url);
                        request.abort();
                        startRequest(rewritten, 'GET', undefined);
                        return;
                    }
                }

                response.on('data', (chunk) => {
                    responseData += chunk.toString();
                });

                response.on('end', () => {
                    if (myGeneration !== requestGeneration) return;
                    resolve(buildNetResponse(
                        finalUrl,
                        options.url,
                        statusCode,
                        response.statusMessage,
                        responseHeaders,
                        responseData,
                    ));
                });
            });

            request.on('error', (error) => {
                if (myGeneration !== requestGeneration) return;
                console.error('eSlideManager relay request error:', error.message || error);
                reject(error);
            });

            request.end();
        }

        startRequest(options.url, initialMethod, initialBody);
    });
}

function makeEsmRequest(client, options) {
    if (client.usingRelay) {
        return makeRelayRequest(client, options);
    }
    return makeRequest(options);
}

/**
 * eSlideManager API client
 * Handles authentication and slide search functionality
 */
class ESMAPI {
    /**
     * @param {string} [canonicalUrl=''] - Canonical eSM base URL
     * @param {{ proxyUrl?: string }} [options]
     */
    constructor(canonicalUrl = '', options = {}) {
        const proxyUrl = options.proxyUrl ?? '';
        this.canonicalBase = normalizeEsmBaseUrl(canonicalUrl) || '';
        this.proxyBase = normalizeEsmBaseUrl(proxyUrl) || null;
        this.usingRelay = Boolean(this.proxyBase);
        this.api_url = this.proxyBase || this.canonicalBase;
        this.currentUsername = null;
        this.currentPassword = null;
        this.lookupPromise = null;
        this.xmlparser = new XMLParser();
        this.loginURL = `${this.api_url}/Login.php`;
    }

    esmUrl(relativePath) {
        const path = String(relativePath).replace(/^\//, '');
        return `${this.api_url}/${path}`;
    }

    rewriteRelayRedirect(redirectUrl, currentUrl) {
        if (!this.usingRelay) return redirectUrl;
        return rewriteRelayRedirectUrl(
            redirectUrl,
            currentUrl || this.api_url,
            this.canonicalBase,
            this.proxyBase,
        );
    }

    /**
     * Authenticate with eSlideManager
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise<Object>} Response object or error object with {error: 'login error', message: string}
     */
    doLogin(username, password) {
        return makeEsmRequest(this, {
            method: 'GET',
            url: this.loginURL,
        })
            .then(() => {
                const formData = new URLSearchParams();
                formData.append('user', username);
                formData.append('password', password);

                return makeEsmRequest(this, {
                    method: 'POST',
                    url: this.esmUrl('authenticate.php'),
                    data: formData.toString(),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Referer': this.loginURL,
                        'Origin': this.api_url,
                    },
                });
            })
            .then((authResponse) => {
                const finalUrl = getResponseFinalUrl(authResponse);

                if (isLoginPageUrl(finalUrl)) {
                    this.currentUsername = '';
                    this.currentPassword = '';

                    let errorMessage = 'Login failed';
                    try {
                        const urlObj = new URL(finalUrl);
                        const errorString = urlObj.searchParams.get('ErrorString');
                        if (errorString) {
                            errorMessage = decodeURIComponent(errorString);
                        }
                    } catch (urlError) {
                        // Ignore parsing errors
                    }

                    logLoginStepFailure('authenticate', authResponse, errorMessage);
                    return { error: 'login error', message: errorMessage };
                }

                const authCheck = validateLoginStepResponse(authResponse, 'authenticate');
                if (authCheck.error) {
                    this.currentUsername = '';
                    this.currentPassword = '';
                    logLoginStepFailure('authenticate', authResponse, authCheck.error);
                    return { error: 'login error', message: authCheck.error };
                }
                if (authCheck.loginRequired) {
                    this.currentUsername = '';
                    this.currentPassword = '';
                    logLoginStepFailure('authenticate', authResponse, 'Login failed');
                    return { error: 'login error', message: 'Login failed' };
                }

                this.currentUsername = username;
                this.currentPassword = password;

                return makeEsmRequest(this, {
                    method: 'GET',
                    url: this.esmUrl('DetermineHierarchy.php?RoleId=99&HierarchyId=1'),
                    headers: {
                        'Referer': this.esmUrl('authenticate.php'),
                    },
                });
            })
            .then((response) => {
                if (response?.error) return response;

                const hierarchyCheck = validateLoginStepResponse(response, 'DetermineHierarchy');
                if (hierarchyCheck.error || hierarchyCheck.loginRequired) {
                    this.currentUsername = '';
                    this.currentPassword = '';
                    const message = hierarchyCheck.error || 'Login session could not be established';
                    logLoginStepFailure('DetermineHierarchy', response, message);
                    return {
                        error: 'login error',
                        message,
                    };
                }
                return { ok: true };
            });
    }

    /**
     * Try to login, using cached credentials if available
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise<Object>} {ok: boolean} or {error: string, ok: false}
     */
    async tryLogin(username, password) {
        if (username === this.currentUsername && password === this.currentPassword && this.currentUsername && this.currentPassword) {
            return { ok: true };
        }
        return this.doLogin(username, password).then((response) => {
            if (response.error) {
                console.error('eSlideManager login failed:', {
                    message: response.message || response.error,
                });
                return { error: response.message || 'Login failed', ok: false };
            }
            return { ok: true };
        });
    }

    retryAuthAndFindSlides(username, password, accessionNumber, authRetryDepth) {
        if (authRetryDepth >= MAX_AUTH_RETRIES) {
            return Promise.reject({
                error: 'auth_exhausted',
                message: 'Session expired or login failed. Log out and log in again.',
            });
        }
        return this.doLogin(username, password).then((loginResponse) => {
            if (loginResponse.error) {
                return { error: 'login failed', message: loginResponse.message };
            }
            return this.findSlides(username, password, accessionNumber, authRetryDepth + 1);
        });
    }

    /**
     * Search for slides by accession number
     * @param {string} username - Username for authentication
     * @param {string} password - Password for authentication
     * @param {string} [accessionNumber=''] - Accession number to search for
     * @returns {Promise<Array>} Array of slide objects with BlockId, StainId, BarcodeId, etc.
     */
    findSlides(username, password, accessionNumber = '', authRetryDepth = 0) {
        if (typeof accessionNumber !== 'string') {
            return Promise.reject({ error: 'Accession number must be a string' });
        }

        const formData = new URLSearchParams();
        formData.append('BasedOnSearchId', -1);
        formData.append('TableName', 'Slide');
        formData.append('FieldName[]', 'AccessionNumber');
        formData.append('Table[]', 'Specimen');
        formData.append('FieldOperator[]', '=');
        formData.append('FieldValue[]', accessionNumber);
        formData.append('FieldValue2[]', '');
        formData.append('SearchName', '');

        let promise = null;
        if (username !== this.currentUsername || password !== this.currentPassword) {
            promise = this.doLogin(username, password);
        }

        return Promise.resolve(promise).then(() => {
            return makeEsmRequest(this, {
                method: 'POST',
                url: this.esmUrl('Records_List.php'),
                data: formData.toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': this.loginURL,
                    'Origin': this.api_url
                }
            });
        })
        .then(response => {
            const finalUrl = response.request?.res?.responseUrl || 
                           response.request?.responseURL ||
                           response.config.url;
            const redirectedToLogin = isLoginPageUrl(finalUrl);

            if (redirectedToLogin) {
                return this.retryAuthAndFindSlides(username, password, accessionNumber, authRetryDepth);
            }

            const recordsListCheck = validateRecordsListSetupResponse(response);
            if (recordsListCheck.loginRequired) {
                return this.retryAuthAndFindSlides(username, password, accessionNumber, authRetryDepth);
            }
            if (recordsListCheck.error) {
                logSearchStepFailure('Records_List', response, recordsListCheck.error);
                return Promise.reject({
                    error: 'records_list_failed',
                    message: recordsListCheck.error,
                });
            }

            const formData2 = new URLSearchParams();
            formData2.append('ListName', 'ListSlide');
            formData2.append('Page', 1);
            formData2.append('RecordsPerPage', 500);
            formData2.append('SortField', 'CompressedFileLocation');
            formData2.append('SortOrder', 'Ascending');
            formData2.append('TableName', 'Slide');
            formData2.append('Columns[]', 'BarcodeId,BlockId,StainId,CompressedFileLocation,ImageId,ScanDate');
            formData2.append('IsExpanded', 1);
            formData2.append('AJAX', 1);
            
            return makeEsmRequest(this, {
                method: 'POST',
                url: this.esmUrl('GetFilteredRecordList.php'),
                data: formData2.toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Referer': this.esmUrl('Records_List.php'),
                    'Origin': this.api_url
                }
            })
                .then((response) => parseFilteredRecordListResponse(response));
        })
        .catch(e => {
            console.error('eSlideManager search error:', e.message || e);
            // Reset credentials on error
            this.currentUsername = null;
            this.currentPassword = null;
            return Promise.reject(e);
        });
    }

    /**
     * Search for slides by accession number (with request queuing)
     * Ensures only one search request is active at a time
     * @param {string} username - Username for authentication
     * @param {string} password - Password for authentication
     * @param {string} [accessionNumber=''] - Accession number to search for
     * @returns {Promise<Array>} Array of slide objects
     */
    searchByAccession(username, password, accessionNumber = '') {
        const runSearch = () => {
            this.lookupPromise = this.findSlides(username, password, accessionNumber);
            return this.lookupPromise.then(result => {
                this.lookupPromise = null;
                return result;
            }).catch(error => {
                this.lookupPromise = null;
                throw error;
            });
        };

        if (this.lookupPromise) {
            return this.lookupPromise.then(() => runSearch());
        }
        return runSearch();
    }

    /**
     * Logout and clear cached credentials
     * Note: Cookies are handled automatically by Electron's net module
     * @returns {Object} {ok: true, message: "Logged out"}
     */
    logout() {
        this.currentUsername = null;
        this.currentPassword = null;
        this.lookupPromise = null;
        return { ok: true, message: "Logged out" };
    }
}

export default ESMAPI;
