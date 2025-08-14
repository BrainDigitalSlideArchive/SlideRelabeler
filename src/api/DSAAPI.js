import http from 'http';
import https from 'https';
import { URL } from 'url';
import fs from 'fs';
import { app, safeStorage } from 'electron';
import { join, basename,  } from 'path';

class DSAAPI {
    perform_request(sub_url, method, data = null, content_type = 'application/json') {
        return new Promise((resolve, reject) => {
            console.log("Performing request:", this.api_url + sub_url);
            const request_url = this.api_url + sub_url;
            const url = new URL(request_url);
            
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Girder-Token': this.api_auth.authToken.token,
                    'Content-Type': content_type,
                    'User-Agent': 'SlideRelabeler/1.0'
                }
            };

            const httpModule = url.protocol === 'https:' ? https : http;
            
            const req = httpModule.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    console.log("Response data:", responseData);
                    try {
                        const parsedResponse = JSON.parse(responseData);
                        
                        if (res.statusCode === 200) {
                            resolve([true, parsedResponse]);
                        } else if (res.statusCode === 400) {
                            resolve([false, parsedResponse]);
                        } else if (res.statusCode === 403) {
                            resolve([false, parsedResponse]);
                        } else {
                            resolve([false, {message: `HTTP Error: ${res.statusCode}`, status: res.statusCode}]);
                        }
                    } catch (error) {
                        resolve([false, {message: "Invalid JSON response", status: res.statusCode, data: responseData}]);
                    }
                });
            });
            
            req.on('error', (error) => {
                resolve([false, {message: "Network error occurred", status: 0, error: error.message}]);
            });
            
            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    begin_upload_file_to_folder(folder_id, file_path) {
        if (fs.existsSync(file_path)) {
            const file_basename = basename(file_path);
            const ext = extname(file_path);
            return this.post('/file', {
                name: `${file_basename}${ext}`,
                parentId: folder_id,
                parentType: 'folder',
            })
        }
    }

    upload_file_chunk(file_id, chunk_data, offset) {
        return this.post(`/file/${file_id}/upload`, {
            offset: offset,
            chunk: chunk_data
        })
    }

    // finish_upload_file(file_id) {
    //     return this.post(`/file/${file_id}/upload`, {
    // }

    get_tile(item_id, level, x, y) {
        return this.get(`/item/${item_id}/tiles/zxy/${level}/${x}/${y}`);
    }

    get_collections() {
        return this.get('/collection');
    }

    get_files_for_collection(collection_id) {
        // Doesn't seem functional on megabrain dsa, issue with CORS
        return this.get(`/files/collection/${collection_id}`);
    }

    get_folder_item(folder_id) {
        return this.get('/item', {folderId: folder_id});
    }

    get_item(item_id) {
        return this.get(`/item/${item_id}`);
    }

    get_file(file_id) {
        return this.get(`/file/${file_id}`);
    }

    get_large_image_metadata(item_id) {
        return this.get(`/item/${item_id}/tiles`);
    }

    get_folder(parent_id, parent_type = 'folder') {
        const params = {
            parentType: parent_type,
            parentId: parent_id
        }
        return this.get(`/folder`, params);
    }

    get_collection_details_by_id(collection_id) {
        return this.get(`/collection/${collection_id}/details`);
    }

    delete(sub_url, url_params = null) {
        if (url_params) {
            sub_url += this.process_url_params(url_params);
        }
        return this.perform_request(sub_url, 'DELETE');
    }

    process_url_params(url_params) {
        let url = '?';
        for (const key in url_params) {
            url += `${key}=${encodeURI(url_params[key])}&`;
        }
        return url;
    }

    get(sub_url, url_params = null) {
        if (url_params) {
            sub_url += this.process_url_params(url_params);
        }
        return this.perform_request(sub_url, 'GET');
    }

    post(sub_url, post_data, url_params = null) {
        if (url_params) {
            sub_url += this.process_url_params(url_params);
        }
        return this.perform_request(sub_url, 'POST', post_data);
    }

    put(sub_url, put_data, url_params = null) {
        if (url_params) {
            sub_url += this.process_url_params(url_params);
        }
        return this.perform_request(sub_url, 'PUT', put_data);
    }

    check_auth() {
        // Check to see if authorization already done
        let user_data_path = app.getPath('userData')
        let app_data_path = join(user_data_path, 'dsa_auth.tmp')
        let dsa_url_path = join(user_data_path, 'dsa_url.tmp')
        let exists = fs.existsSync(app_data_path);

        let api_auth = null;
        let api_url = null;

        if (exists) {
            api_auth = JSON.parse(safeStorage.decryptString(fs.readFileSync(app_data_path)));
            api_url = safeStorage.decryptString(fs.readFileSync(dsa_url_path));
        }


        if (this.api_auth && this.api_url) {
            return [true, this.api_auth];
        } else if (api_auth && api_url) {
            this.api_auth = api_auth;
            this.api_url = api_url;
            return [true, this.api_auth];
        } else {
            return false;
        }
    }

    logout() {
        let user_data_path = app.getPath('userData')
        let app_data_path = join(user_data_path, 'dsa_auth.tmp')
        fs.unlinkSync(app_data_path);
        this.api_auth = null;
        this.api_url = null;
        return [true, {message: "Logged out"}];
    }

    login(username, password) {
        return new Promise((resolve, reject) => {
            console.log("Logging in to:", this.api_url + '/user/authentication');
            let url = null;
            try {
                url = new URL(this.api_url + '/user/authentication');
            } catch (error) {
                resolve([false, {message: "Invalid API URL. Please check your API URL."}]);
            }

            const credentials = Buffer.from(`${username}:${password}`).toString('base64');
            
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname,
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${credentials}`
                }
            };

            const httpModule = url.protocol === 'https:' ? https : http;
            
            const req = httpModule.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    this.handle_auth_response(res, responseData, resolve);
                });
            });
            
            req.on('error', (error) => {
                resolve([false, {message: "Network error during login", error: error.message}]);
            });

            req.end();
        });
    }

    handle_auth_response(res, responseData, resolve) {
        try {
            if (res.statusCode === 200) {
                const success_response = JSON.parse(responseData);
                this.api_auth = success_response;

                // Set the api auth in local storage
                // Does overwrite previous api authentication data
                let user_data_path = app.getPath('userData')
                let app_data_path = join(user_data_path, 'dsa_auth.tmp')
                let dsa_url_path = join(user_data_path, 'dsa_url.tmp')
                fs.writeFileSync(app_data_path, safeStorage.encryptString(JSON.stringify(success_response)));
                fs.writeFileSync(dsa_url_path, safeStorage.encryptString(this.api_url));

                resolve([true, success_response]);
            } else if (res.statusCode === 400) {
                const error_response = JSON.parse(responseData);
                console.log("Authentication error:", error_response);
                resolve([false, error_response]);
            } else if (res.statusCode === 404) {
                resolve([false, {message: "Unable to connect to API URL. Please check your API URL."}]);
            } else {
                resolve([false, {message: "Unable to authenticate. Please check your username and password."}]);
            }
        } catch (error) {
            resolve([false, {message: "Invalid JSON response during authentication", error: error.message}]);
        }
    }

    authenticate(api_url, api_key) {
        this.api_url = api_url;
        this.api_key = api_key;

        return new Promise((resolve, reject) => {
            const check_auth = this.check_auth();
            if (check_auth) {
                resolve(check_auth);
                return;
            }
            
            const url = new URL(api_url + '/api_key/token');
            
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'SlideRelabeler/1.0'
                }
            };

            const httpModule = url.protocol === 'https:' ? https : http;
            
            const req = httpModule.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    this.handle_auth_response(res, responseData, resolve);
                });
            });
            
            req.on('error', (error) => {
                resolve([false, {message: "Network error during authentication", error: error.message}]);
            });
            
            const post_data = encodeURI(`key=${api_key}`);
            req.write(post_data);
            req.end();
        });
    }

    constructor(api_url = null, api_key = null) {
        this.api_auth = null;
        this.api_url = api_url;
        this.api_key = api_key;
    }
}

export default DSAAPI;