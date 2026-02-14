import { net } from 'electron';
import { XMLParser } from "fast-xml-parser";

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

/**
 * eSlideManager API client
 * Handles authentication and slide search functionality
 */
class ESMAPI {
    /**
     * @param {string} [api_url='https://eslide.upmc.edu'] - Base URL for eSlideManager API
     */
    constructor(api_url = 'https://eslide.upmc.edu') {
        this.api_url = api_url;
        this.currentUsername = null;
        this.currentPassword = null;
        this.lookupPromise = null;
        this.xmlparser = new XMLParser();
        this.loginURL = `${this.api_url}/Login.php`;
    }

    /**
     * Authenticate with eSlideManager
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise<Object>} Response object or error object with {error: 'login error', message: string}
     */
    doLogin(username, password) {
        return makeRequest({
            method: 'GET',
            url: this.loginURL
        })
            .then(() => {
                const formData = new URLSearchParams();
                formData.append('user', username);
                formData.append('password', password);
                
                return makeRequest({
                    method: 'POST',
                    url: `${this.api_url}/authenticate.php`,
                    data: formData.toString(),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Referer': this.loginURL,
                        'Origin': this.api_url
                    }
                });
            })
            .then(response => {
                // Get final URL to check if login was successful
                const finalUrl = response.request?.res?.responseUrl || 
                               response.request?.responseURL ||
                               response.config.url;
                
                if (finalUrl && finalUrl.split('?')[0] === this.loginURL) {
                    // Login failed - redirected back to login page
                    this.currentUsername = '';
                    this.currentPassword = '';
                    
                    // Extract error message from query parameters if present
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
                    
                    console.error('eSlideManager login failed:', errorMessage);
                    return { error: 'login error', message: errorMessage };
                } else {
                    // Login successful - cache credentials
                    this.currentUsername = username;
                    this.currentPassword = password;
                    
                    return makeRequest({
                        method: 'GET',
                        url: `${this.api_url}/DetermineHierarchy.php?RoleId=99&HierarchyId=1`,
                        headers: {
                            'Referer': `${this.api_url}/authenticate.php`
                        }
                    });
                }
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
        return this.doLogin(username, password).then(response => {
            if (response.error) {
                return { error: 'Login failed', ok: false };
            } else {
                return { ok: true };
            }
        });
    }

    /**
     * Search for slides by accession number
     * @param {string} username - Username for authentication
     * @param {string} password - Password for authentication
     * @param {string} [accessionNumber=''] - Accession number to search for
     * @returns {Promise<Array>} Array of slide objects with BlockId, StainId, BarcodeId, etc.
     */
    findSlides(username, password, accessionNumber = '') {
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
            return makeRequest({
                method: 'POST',
                url: `${this.api_url}/Records_List.php`,
                data: formData.toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': `${this.api_url}/Login.php`,
                    'Origin': this.api_url
                }
            });
        })
        .then(response => {
            // if redirected to the login page, log in, then retry
            const finalUrl = response.request?.res?.responseUrl || 
                           response.request?.responseURL ||
                           response.config.url;
            
            if (finalUrl && finalUrl.startsWith(this.loginURL)) {
                return this.doLogin(username, password).then(loginResponse => {
                    if (loginResponse.error) {
                        //login failed, return a login error
                        return {error: 'login failed'};
                    } else {
                        return this.findSlides(username, password, accessionNumber);
                    }
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
            
            return makeRequest({
                method: 'POST',
                url: `${this.api_url}/GetFilteredRecordList.php`,
                data: formData2.toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': `${this.api_url}/Records_List.php`,
                    'Origin': this.api_url
                }
            })
                .then(response => {
                    // Check if response.data exists and has Rows
                    if (!response.data) {
                        console.error('Response data is undefined. Status:', response.status);
                        return Promise.reject({ error: 'no_data', message: 'Invalid response: no data' });
                    }
                    
                    if (!response.data.Rows) {
                        console.error('Response data.Rows is undefined. Response data:', response.data);
                        return Promise.reject({ error: 'no_rows', message: 'Invalid response: no Rows in data. The server may have returned an error or different format.', data: response.data });
                    }
                    
                    if (!Array.isArray(response.data.Rows)) {
                        console.error('Response data.Rows is not an array:', typeof response.data.Rows, response.data.Rows);
                        return Promise.reject({ error: 'invalid_rows', message: 'Invalid response: Rows is not an array' });
                    }
                    
                    // Extract slide data from response
                    const fields = ['BlockId', 'StainId', 'BarcodeId', 'CompressedFileLocation', 'ScanDate'];
                    const data = response.data.Rows.map(row => {
                        const slide = fields.reduce((obj, field) => {
                            obj[field] = row.Cells[field].Contents;
                            return obj;
                        }, {});
                        slide.ImageId = row.Attributes.ImageIds;
                        // Extract slide number from barcode (format: ;s<number>;)
                        const slideNumMatch = slide.BarcodeId.match(/;s(\d+);/i);
                        slide.SlideNum = slideNumMatch ? parseInt(slideNumMatch[1]) : null;
                        slide.SlideId = row.Attributes.Ids;
                        return slide;
                    });
                    
                    return data;
                });
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
        // Queue requests to ensure only one search is active at a time
        if (this.lookupPromise) {
            return this.lookupPromise.then(() => {
                this.lookupPromise = this.findSlides(username, password, accessionNumber);
                return this.lookupPromise;
            });
        } else {
            this.lookupPromise = this.findSlides(username, password, accessionNumber);
            return this.lookupPromise.then(result => {
                this.lookupPromise = null; // Clear after completion
                return result;
            }).catch(error => {
                this.lookupPromise = null; // Clear on error
                throw error;
            });
        }
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
