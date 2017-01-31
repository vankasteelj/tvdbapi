# TheTVDB Api

Node.js wrapper for thetvdb.com [rest API](https://api.thetvdb.com/swagger)

### installation

```
npm install tvdbapi
```

### usage

```js
const tvdb = new (require('tvdbapi'))({
    apikey: <your_api_key>
    endpoint: //optional
    version: //optional
    language: //optional
});
```


### user login

```js
tvdb.login({username: <your_username>, userkey: <your_userkey>})
  .then(auth => console.log('connected', auth))
  .catch(console.error);
```

### calls

The module is using a built-in login function, so you don't have to mess around with sessions. All available calls are listed in the `methods.json` file, and available on [the wiki](https://github.com/vankasteelj/tvdbapi/wiki/available-API-calls).

## License 

The MIT License - Copyright (c) 2017 Jean van Kasteel <vankasteelj@gmail.com>

>Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

>The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

>THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.