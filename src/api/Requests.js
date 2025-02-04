class Requests {
    perform_request(url, method, data=null, content_type='application/json') {
        return new Promise((resolve, reject) => {
            this.xml_request.open(method, url, true);
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

    delete(url, url_params=null) {
        if (url_params) {
            url += this.process_url_params(url_params);
        }
        return this.perform_request(url, 'DELETE');
    }

    process_url_params(url_params) {
        let url = '?';
        for (const key in url_params) {
            url += `${key}=${encodeURI(url_params[key])}&`;
        }
        return url;
    }

    get(url, url_params=null) {
        if (url_params) {
          url += this.process_url_params(url_params);
        }
        return this.perform_request(url, 'GET');
    }

    post(url, post_data, url_params=null) {
        if (url_params) {
          url += this.process_url_params(url_params);
        }
        return this.perform_request(url, 'POST', post_data);
    }

    put(url, put_data, url_params=null) {
        if (url_params) {
          url += this.process_url_params(url_params);
        }
        return this.perform_request(url, 'PUT', put_data);
    }

    constructor() {
        this.xml_request = new XMLHttpRequest();
        this.xml_request.withCredentials = false;
    }
}

export default Requests;