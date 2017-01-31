'use strict'

const defaultUrl = 'https://api.thetvdb.com';
const tokenTTL = 24 * 60 * 60 * 1000; // 24 hours

const got = require('got');
const methods = require('./methods.json');

module.exports = class TVDB {
    constructor(settings = {}) {
        if (!settings.apikey) throw Error('requires an apikey');

        this._authentication = {};
        this._settings = {
            apikey: settings.apikey,
            endpoint: settings.endpoint || defaultUrl,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        settings.version && (this._settings.headers['Accept'] = 'application/vnd.thetvdb.v' + settings.version);

        settings.language && (this._settings.headers['Accept-Language'] = settings.language);

        this._construct();
    }

    _login(opts = {}) {
        let auth = {apikey: this._settings.apikey};

        if (opts.username && opts.userkey) {
            this._authentication = {} // reset
            this._authentication.username = opts.username;
            this._authentication.userkey = opts.userkey;
        }

        if (this._authentication.token && this._authentication.token_expires > Date.now()) {
            return Promise.resolve(this._authentication);
        } else {
            auth = Object.assign(auth, this._authentication);
        }

        let req = {
            url: this._settings.endpoint + '/login',
            headers: this._settings.headers,
            body: JSON.stringify(auth)
        };

        return got(req.url, req).then(res => {
            const body = JSON.parse(res.body)
            this._authentication.token = body.token;
            this._authentication.token_expires = Date.now() + tokenTTL;

            return this._authentication;
        });
    }

    // Creates methods for all requests
    _construct() {
        for (let url in methods) {
            const urlParts = url.split('/');
            const name = urlParts.pop(); // key for function

            let tmp = this;
            for (let p = 1; p < urlParts.length; ++p) { // acts like mkdir -p
                tmp = tmp[urlParts[p]] || (tmp[urlParts[p]] = {});
            }

            tmp[name] = (() => {
                const method = methods[url]; // closure forces copy
                return (params) => {
                    return this._call(method, params);
                };
            })();
        }
    }

    // Parse url before api call
    _parse(method, params = {}) {
        if (method.auth && !this._authentication.token && !this._authentication.userkey) throw Error('requires user authentication');

        const queryParts = [];
        const pathParts = [];

        // ?Part
        const queryPart = method.url.split('?')[1];
        if (queryPart) {
            const queryParams = queryPart.split('&');
            for (let i in queryParams) {
                const name = queryParams[i].split('=')[0];
                (params[name] || params[name] === 0) && queryParts.push(name + '=' + params[name]);
            }
        }

        // /part
        const pathPart = method.url.split('?')[0];
        const pathParams = pathPart.split('/');
        for (let k in pathParams) {
            if (pathParams[k][0] != ':') {
                pathParts.push(pathParams[k]);
            } else {
                const param = params[pathParams[k].substr(1)];
                if (param || param === 0) {
                    pathParts.push(param);
                } else {
                    // check for missing required params
                    if (method.optional && method.optional.indexOf(pathParams[k].substr(1)) === -1) throw Error('Missing mandatory paramater: ' + pathParams[k].substr(1));
                }
            }
        }

        // Pagination
        if (method.pagination) {
            params['page'] && queryParts.push('page=' + params['page']);
        }

        let url = this._settings.endpoint;

        url += pathParts.join('/');

        if (queryParts.length) url += '?' + queryParts.join('&');
        return url;
    }

    // Parse methods then hit API
    _call(method, params) {
        return this._login().then(() => {
            const req = {
                method: method.method || 'GET',
                url: this._parse(method, params),
                headers: Object.assign({
                    'Authorization': 'Bearer ' + this._authentication.token
                }, this._settings.headers),
                body: (method.body ? Object.assign({}, method.body) : {})
            };

            for (let k in params) {
                if (k in req.body) req.body[k] = params[k];
            }
            for (let k in req.body) {
                if (!req.body[k]) delete req.body[k];
            }

            req.body = JSON.stringify(req.body);

            return got(req.url, req);
        }).then(response => JSON.parse(response.body));
    }
}