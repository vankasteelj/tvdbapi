'use strict'

const defaultUrl = 'https://api4.thetvdb.com/v4'
const tokenTTL = 28 * 24 * 60 * 60 * 1000 // 28 days

const got = require('got')
const methods = require('./methods.json')

module.exports = class TVDB {
  constructor(settings = {}) {
    if (!settings.apikey) throw Error('requires an apikey')

    this._authentication = {}
    this._settings = {
      apikey: settings.apikey,
      endpoint: settings.endpoint || defaultUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    this._construct()
  }

  login(opts = {}) {
    let auth = {apikey: this._settings.apikey}

    if (opts.token && opts.token_expires) {
      this._authentication.token = opts.token
      this._authentication.token_expires = opts.token_expires
    } else {
      this._authentication = {} // reset
      if (opts.pin) this._authentication.pin = opts.pin
    }

    if (this._authentication.token && this._authentication.token_expires > Date.now()) {
      return Promise.resolve(this._authentication)
    } else {
      auth = Object.assign(auth, this._authentication)
    }

    const req = {
      method: 'POST',
      headers: this._settings.headers,
      body: JSON.stringify(auth)
    }
    const url = this._settings.endpoint + '/login'

    return got(url, req).then(res => {
      const body = JSON.parse(res.body)
      this._authentication.token = body.data.token
      this._authentication.token_expires = Date.now() + tokenTTL

      return this._authentication
    });
  }

  // Creates methods for all requests
  _construct() {
    for (let url in methods) {
      const urlParts = url.split('/')
      const name = urlParts.pop() // key for function

      let tmp = this
      for (let p = 1; p < urlParts.length; ++p) { // acts like mkdir -p
        tmp = tmp[urlParts[p]] || (tmp[urlParts[p]] = {})
      }

      tmp[name] = (() => {
        const method = methods[url] // closure forces copy
        return (params) => {
          return this._call(method, params)
        }
      })()
    }
  }

  // Parse url before api call
  _parse(method, params = {}) {
    if (!this._authentication.token) throw Error('requires a bearer token, login first')

    const queryParts = []
    const pathParts = []

    // ?Part
    const queryPart = method.url.split('?')[1]
    if (queryPart) {
      const queryParams = queryPart.split('&')
      for (let i in queryParams) {
        const name = queryParams[i].split('=')[0]; // that ; is needed
        (params[name] || params[name] === 0) && queryParts.push(`${name}=${encodeURIComponent(params[name])}`)
      }
    }

    // /part
    const pathPart = method.url.split('?')[0]
    const pathParams = pathPart.split('/')
    for (let k in pathParams) {
      if (pathParams[k][0] != ':') {
        pathParts.push(pathParams[k])
      } else {
        const param = params[pathParams[k].substr(1)]
        if (param || param === 0) {
          pathParts.push(param)
        } else {
          // check for missing required params
          if (!method.optional) method.optional = []
          if (method.optional.indexOf(pathParams[k].substr(1)) === -1) throw Error(`Missing mandatory paramater: ${pathParams[k].substr(1)}`)
        }
      }
    }

    // Pagination
    if (method.pagination) {
      params['page'] && queryParts.push('page=' + params['page'])
    }

    let url = this._settings.endpoint

    url += pathParts.join('/')

    if (queryParts.length) url += '?' + queryParts.join('&')
    return url
  }

  // Parse methods then hit API
  _call(method, params) {
    return this.login(this._authentication).then(() => {
      const url = this._parse(method, params)
      const req = {
        method: method.method || 'GET',
        headers: Object.assign({
          'Authorization': 'Bearer ' + this._authentication.token
        }, this._settings.headers)
      }

      if (req.method !== 'GET') {
        req.body = (method.body ? Object.assign({}, method.body) : {})
        for (let k in params) {
          if (k in req.body) req.body[k] = params[k]
        }
        for (let k in req.body) {
          if (!req.body[k]) delete req.body[k]
        }
        req.body = JSON.stringify(req.body)
      }

      return got(url, req)
    }).then(response => JSON.parse(response.body))
  }
}