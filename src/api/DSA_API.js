class DSA_API {
    perform_request(sub_url, method, data=null, content_type='application/json') {
        return new Promise((resolve, reject) => {
            const request_url = this.api_url + sub_url;
            this.xml_request.open(method, request_url, true);
            this.xml_request.setRequestHeader('Girder-Token', this.api_auth.authToken.token);
            this.xml_request.setRequestHeader('Content-Type', content_type);
            this.xml_request.onload = () => {
                if (this.xml_request.status === 200) {
                    resolve([true, JSON.parse(this.xml_request.responseText)]);
                } else if (this.xml_request.status === 400) {
                    resolve([false, JSON.parse(this.xml_request.responseText)]);
                } else if (this.xml_request.status === 403) {
                    resolve([false, JSON.parse(this.xml_request.responseText)]);
                }
            }
            if (data) {
                this.xml_request.send(JSON.stringify(data));
            } else {
                this.xml_request.send();
            }
        });
    }

    get_collections() {
        return this.get('/collection');
    }

    get_files_for_collection(collection_id) {
        // Doesn't seem functional on megabrain dsa, issue with CORS
        return this.get(`/files/collection/${collection_id}`);
    }

    get_folder(parent_id, parent_type='folder') {
        const params = {
            parentType: parent_type,
            parentId: parent_id
        }
        return this.get(`/folder`, params);
    }

    get_collection_details_by_id(collection_id) {
        return this.get(`/collection/${collection_id}/details`);
    }

    delete(sub_url, url_params=null) {
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

    get(sub_url, url_params=null) {
        if (url_params) {
            sub_url += this.process_url_params(url_params);
        }
        return this.perform_request(sub_url, 'GET');
    }

    post(sub_url, post_data, url_params=null) {
        if (url_params) {
            sub_url += this.process_url_params(url_params);
        }
        return this.perform_request(sub_url, 'POST', post_data);
    }

    put(sub_url, put_data, url_params=null) {
        if (url_params) {
            sub_url += this.process_url_params(url_params);
        }
        return this.perform_request(sub_url, 'PUT', put_data);
    }

    check_auth() {
        // Check to see if authorization already done
        if (localStorage.getItem('api_auth')) {
            this.api_auth = JSON.parse(localStorage.getItem('api_auth'));
            this.api_url = localStorage.getItem('api_url');
            return [true, this.api_auth];
        } else {
            return false;
        }
    }

    logout() {
        localStorage.removeItem('api_auth');
        localStorage.removeItem('api_url');
        this.api_auth = null;
        this.api_url = null;
    }

    authenticate(api_url, api_key) {
        return new Promise((resolve, reject) => {
            const check_auth = this.check_auth();
            if (check_auth) {
                resolve(check_auth);
            }
            this.api_url = api_url;
            this.api_key = api_key;
            this.xml_request.open('POST', api_url + '/api_key/token', true);
            this.xml_request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            const post_data = encodeURI(`key=${api_key}`);
            this.xml_request.onload = () => {
                if (this.xml_request.status === 200) {
                    const success_response = JSON.parse(this.xml_request.responseText);
                    console.log("Authentication response:", success_response);
                    this.api_auth = success_response
                    localStorage.setItem('api_auth', JSON.stringify(success_response));
                    localStorage.setItem('api_url', api_url);
                    resolve([true, success_response]);
                }
                else if (this.xml_request.status == 400) {
                    const error_response = JSON.parse(this.xml_request.responseText);
                    console.log("Authentication error:", error_response);
                    resolve([false, error_response]);
                }
                else if (this.xml_request.status == 404) {
                    resolve([false, {message: "Unable to connect to API URL. Please check your API URL."}]);
                }
                else {
                    // const json_data = JSON.parse(this.xml_request.responseText);
                    resolve([false, {message: "Unable to authenticate using API url and key. Please check your API URL and key."}]);
                }
            }
            this.xml_request.send(post_data);
        });
    }

    constructor() {
        this.xml_request = new XMLHttpRequest();
        this.xml_request.withCredentials = false;
    }
}

export default DSA_API;