# sicarii
The zero dependency http2 nodejs multithreading framework

![cd-img] ![dep-img] ![syn-img] ![sz-img]

[![NPM Version][npm-img]][npm-url] ![lic-img]

## Installation

npm

```sh
$ npm install sicarii --save
```

git
```sh
$ git clone https://github.com/angeal185/sicarii.git
```

## About
documentation tbc

## Initialization

As sicarii is built for http2, SSL certificates are required.
The default path for the ssl certificates is as follows:

* `./cert/localhost.cert`
* `./cert/localhost.key`

These options be edited in the default `./config/config.json` file at `config.server`.
`config.server` accepts all of the same default arguments as nodejs http2 config.

* for using the `key/cert/pfx/ca` options, a path to the file should be provided as the arg.

#### build

run the following line of code in any file inside your cwd to build sicarii.

```js

const { server } = require('sicarii');
// server is master

```

Upon first run and if no config file is found, sicarii will attempt to generate the following.

* `./config` ~ default config directory.
* `./config/config.json` ~ default config file.
* `./config/ip_config.json` ~ default ip whitelist/blacklist file.
* `./render` ~ default render/document directory.
* `./render/index.html` ~ starter html file.
* `./static` ~ default static file directory.
* `./static/css/main.css` ~ starter css file.
* `./static/modules/main.mjs` ~ starter mjs file.

this action is sandboxed for security reasons and is not available to worker threads.

#### server

Sicarii is built to incorporate  multi-threading by default. you can edit your thread count at `config.cluster.workers`

Although many frameworks wrap the server object within their app, limiting your server actions to those they
wish you to have access to, sicarii does not.
sicarii extends the existing nodejs modules in place, leaving you full access to the nodejs server object.
Most of these extensions can be either disabled, replaced, configured or extended.
Below is a simple server setup example.

```js
const { cluster, app } = require('sicarii');

if (cluster.isMaster) {

  for (let i = 0; i < app.config.cluster.workers; i++) {
    cluster.fork();
  }

  for (let id in cluster.workers) {
    cluster.workers[id].on('message', function(msg){
      console.log('worker '+ id +' said: '+ msg)
      // 'worker 1 said: i am loading index.html'
    });
  }


} else {

  const { server, router } = require('sicarii');
  // server is worker ~ sandboxed methods disabled
  router.get('/', function(stream, headers, flags){
    process.send('i am loading index.html');
    stream.headers['test'] = 'ok';
    stream.doc('index.html', 'text/html; charset=utf-8');
  });

  server.listen(app.config.port);
}
```


## router

#### methods

The default allowed router methods can and should be configured at `config.stream.methods`.
* `config.stream.methods` accepts all compatible http methods.
* `config.stream.method_body` contains all of the router methods that accept a body.
* `config.stream.method_query` contains all of the router methods that accept a query string.
* If you are not using a method in your app, you should remove it to improve both the security and performance of your app.

below listed are some basic router method examples:
```js

router.get('/test', function(stream, headers, flags){
  let query = stream.query; //json object

  // add header
  stream.headers['Content-Type'] = 'application/json';

  // add cookie
  stream.cookie('name', 'value',{
    Domain: 'localhost',
    Path: '/',
    Expires: Date.now(),
    MaxAge: 9999,
    HttpOnly: true,
    SameSite: 'Strict',
    Secure: true,
    Priority: 'High'
  })

  // send headers
  stream.respond(stream.headers);
  // send response
  stream.json({test: 'get'});
  //stream.end('some text')
});

// connect stream
router.connect('/test', function(stream, headers, flags){
  let query = stream.query;
  console.log(query)
});

// options stream
router.options('/test', function(stream, headers, flags){
  let query = stream.query;

});

// head stream
router.head('/test', function(stream, headers, flags){
  let query = stream.query;

});

// trace stream
router.trace('/test', function(stream, headers, flags){
  let query = stream.query;

});



// post stream
router.post('/', function(stream, headers, flags){
  let body = stream.body.text; // stream.body.buffer / stream.body.json

  console.log(body)

});

// delete stream
router.delete('/', function(stream, headers, flags){
  let body = stream.body.text; // stream.body.buffer / stream.body.json

  console.log(body)

});

// patch stream
router.patch('/', function(stream, headers, flags){
  let body = stream.body.text; // stream.body.buffer / stream.body.json

  console.log(body)
});

// put stream
router.put('/', function(stream, headers, flags){
  let body = stream.body.text; // stream.body.buffer / stream.body.json

  console.log(body)
});


router.get('/', function(stream, headers, flags){

  //serve headers and serve static document
  stream.doc('/index.html', 'text/html; charset=utf-8');

});



// send response headers and render static document
router.get('/', function(stream, headers, flags){

  stream.doc('index.html', 'text/html; charset=utf-8');

});

router.get('/', function(stream, headers, flags){

  stream.headers['key'] = 'val';

  stream.doc('index.html', 'text/html; charset=utf-8');

});


// send response headers and render with optional template engine installed
router.get('/', function(stream, headers, flags){

  // basic ~ default
  stream.render('index.html', {title: 'basic'})

  // nunjucks
  stream.render('index.njk', {title: 'nunjucks'})

  // pug
  stream.render('index.pug', {title: 'pug'})

});


```


## configuration

```js
//defaults

{
  "port": "8080", // server port
  "origin": "https://localhost", // server origin
  "verbose": true, // show log to console
  "proxy": false, // behind a proxy/reverse proxy?
  "cluster": {
    "workers": 2 // worker count
  },
  "cookie_parser": {
    "enabled": true, //enable cookie parser
    "auto_parse": true //enable auto cookie parse
  },
  "stream": {
    "param_limit": 1000,
    "body_limit": 5000,
    "methods": [ // allowed http  methods
      "get",
      "post",
      "connect",
      "put",
      "delete",
      "head"
    ],
    "method_body": ["post", "delete", "patch", "put"], // methods return body
    "method_query": ["get","connect", "head", "options", "trace"],// methods return query params
    "content_types": [ // accepted body content-types
      "application/json",
      "text/plain",
      "multipart/form-data",
      "application/x-www-form-urlencoded",
      "multipart/form-data"
    ]
  },
  "blacklist": { //enable server ip blacklist
    "enabled": false,
    "msg": "your ip has been blacklisted, have a nice day" // unauth msg
  },
  "whitelist": { //enable server ip whitelist
    "enabled": false,
    "msg": "Unauthorized" // unauth msg
  },
  "authtoken": {  //enable auth token header
    "enabled": false,
    "header": "X-Authtoken",
    "token": "xxxxxx",
    "msg": "server offline" // unauth msg
  },
  "server": { // accepts all http2 nodejs server options
    "cert": "/cert/localhost.cert", // key/cert/pfx/ca as string path to file
    "key": "/cert/localhost.key"
  },
  "store": { // sicarri mem-cache
    "cache": {
      "enabled": false,
      "maxage": 10000
    }
  },
  "static": {
    "path": "/static", // default static file path
    "blocked": [],
    "etag": { // etag header
      "enabled": true, // use etags on rendered files
      "digest": "sha3-256", //etag digest hash ~ crypto.getHashes();
      "encode": "base64" //etag digest encoding hex/base64
    },
    "cache": { // static file server cache
      "enabled": true, // enable cache on static file server
      "maxage": 1000000 // cached items maxAge
    },
    "headers": {} // default headers for static file server
  },
  "render": { // render/tempate engine defaults
    "path": "/render",
    "blocked": [],
    "etag": { // etag header
      "enabled": true, // use etags on rendered files
      "digest": "sha3-256", //etag digest hash ~ crypto.getHashes();
      "encode": "base64" //etag digest encoding hex/base64
    },
    "cache": { // rendered files cache
      "enabled": true, // enable cache on rendered files
      "maxage": 1000000 // cached items maxAge
    },
    "headers": { // default headers for rendered files
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
      "Server": "Nodejs",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "X-DNS-Prefetch-Control": "on",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "X-Content-Type-Options": "nosniff",
      "X-XSS-Protection": "1",
      "TK": "N"
    }
  },
  "gzip": { // gzip compression
    "enabled": true,
    "prezipped": false, // use pre-zipped files
    "ext": ".gz", // pre-zipped file extention
    "setting": { // gzip compression settings
      "level": 9,
      "memLevel": 9,
      "strategy": 0
    }
  },
  "template_engine": {
    "engines": ["basic", "nunjucks", "pug"], //render template engines
    "basic": { // default template engine
      "enabled": true, //enable/disable template engine
      "settings": {}
    },
    "nunjucks": {
      "enabled": false,
      "settings": {
        "autoescape": true,
        "noCache": true, // do not use
        "throwOnUndefined": false,
        "trimBlocks": false,
        "lstripBlocks": false
      }
    },
    "pug": {
      "enabled": false,
      "settings": {
        "pretty": false,
        "filters": {},
        "cache": false // do not use
      }
    }
  },
  "mimetypes": {
    // a list of all your allowed mimetypes
  }
}


```
## stream

  #### stream.doc()

  stream doc will serve a document from the render folder
  * this method will use cache if available
  * this method will use compression if available
  * this method will stream respond headers
  * this method will send default headers from `config.render.headers`
  * this method will use etag settings from `config.render.etag`
  * this method will use cache settings from `config.render.cache`
  * this method will use gzip settings from `config.render.gzip`
  
```js
  router.get('/', function(stream, headers, flags){

    // send response headers and render static document from the render dir
    stream.doc('index.html', 'text/html; charset=utf-8');

  });
```

  #### stream.render() // render document

  stream render will serve a rendered document from the render folder
  refer to template engines.
  * this method will use cache if available
  * this method will use compression if available
  * this method will stream respond headers
  * this method will send default headers from `config.render.headers`
  * this method will use etag settings from `config.render.etag`
  * this method will use cache settings from `config.render.cache`
  * this method will use gzip settings from `config.render.gzip`

```js
  router.get('/', function(stream, headers, flags){

    // basic ~ default
    stream.render('index.html', {title: 'basic'})

    // nunjucks
    stream.render('index.njk', {title: 'nunjucks'})

    // pug
    stream.render('index.pug', {title: 'pug'})

  });
```

  #### stream.file() // send file
    documentation tbc

  #### stream.json() //send json

  stream.json() performs the following actions:

  * add content-type 'application/json' to the headers;
  * stream the headers object.
  * send stringified json

  ```js

  router.get('/', function(stream, headers){

    stream.json({send: 'json'})

  });

  ```


  #### stream.redirect

  stream.redirect() performs the following actions:

  * add location destination to the headers;
  * stream the headers object.
  * send redirect

  ```js

  router.get('/', function(stream, headers){
    //redirect to url
    stream.redirect('/test')

  });

  ```
  #### stream.upload // upload file
    documentation tbc
  #### stream.fetch // fetch external data
    documentation tbc
  #### stream.sync  // send external data
    documentation tbc

  #### stream.headers // header object to be sent
  stream.headers will return an object containing all current and default outbound headers;
  this is not to be mistaken with the received `headers` object;
  ```js
  router.get('/', function(stream, headers, flags){

    //log default received headers to console
    console.log(headers)

    //log default outbound headers to console
    console.log(stream.headers)

    // add outbound header
    stream.headers['Content-Type'] = 'text/plain';

    stream.respond(stream.headers);
    stream.end('headers sent')

  })
  ```

  #### stream.query

  stream.query is part of `body parser`. if enabled, it will parse the given query to json.
  refer to body parses section.
  * `config.stream.method_query` controls the accepted router methods.
  * `config.stream.content_types` controls the accepted content types.

  ```js
  router.get('/test', function(stream, headers, flags){
    let query = stream.query;
    console.log(query)

  });
  ```

  #### stream.body.text
  stream.body.text is the default body parse format
  * returns `string`

  ```js
  router.post('/', function(stream, headers, flags){
    let body = stream.body.text;

    console.log(body)

  });
  ```

  #### stream.body.buffer

  stream.body.buffer is part of `body parser`.
  * returns `buffer`

  ```js
  router.post('/', function(stream, headers, flags){
    let buff = stream.body.buffer;

    console.log(buff)

  });
  ```

  #### stream.body.json

  stream.body.buffer is part of `body parser`.
  refer to body parses section.
  * returns `json` for supported content-types

  ```js
  router.post('/', function(stream, headers, flags){
    let obj = stream.body.json;

    console.log(obj)

  });
  ```

  #### stream.cookies
  this method is a part of cookie parser
  refer to cookie parser

  #### stream.cookie
  this method is a part of cookie parser
  refer to cookie parser

## app
documentation tbc

## body parser

sicarii has its own built in body parser for the following content types:

* `application/json`
* `multipart/form-data`
* `application/x-www-form-urlencoded`

These content types can be enabled/disabled at `config.stream.content_types`.

if you are not using it, remove it from `config.stream.content_types` to improve both security and performance.

The correct content type headers must be sent with the request.

`multipart/form-data` and `application/x-www-form-urlencoded` will automatically be parsed to valid json.

for example:
```js
// query
router.get('/content', function(stream, headers, flags){
  let query = stream.query; //json object

})

// body
router.post('/content', function(stream, headers, flags){
  let body = stream.body.json; //json object
  body = stream.body.buffer; //nodejs buffer
  body = stream.body.text; //string
})
```

All other content types are available as `text` or `buffer`

## etags
documentation tbc

## cookie parser
sicarii has its own built in cookie parser.
* the cookie parser can be enabled/disabled at `config.cookie_parser.enabled`
* with `config.cookie_parser.auto_parse` enabled, inbound cookies will automatically be parsed to json.
* if the cookie parser is disabled, cookies can still be created/parsed through `app.cookie_encode()`/`app.cookie_decode()`.

#### encode cookie
sicarii has two methods for creating serialized cookies.
```js

router.get('/', function(stream, headers, flags){

  //create cookie and add to outbouheaders ~ config.cookie_parser.enabled
  stream.cookie('name', 'value',{
    Domain: 'localhost',
    Path: '/',
    Expires: Date.now(),
    MaxAge: 9999,
    HttpOnly: true,
    SameSite: 'Lax',
    Secure: true,
    Priority: 'High'
  })


  // manual create cookie and add to outbouheaders
  let new_cookie = app.cookie_encode('name', 'value',{
    Domain: 'localhost',
    Path: '/',
    Expires: Date.now(),
    MaxAge: 9999,
    HttpOnly: true,
    SameSite: 'Lax',
    Secure: true,
    Priority: 'High'
  })
  // only required for manual add
  stream.headers['Set-Cookie'] =  new_cookie;


  // send headers
  stream.respond(stream.headers);

  stream.json({msg: 'cookies created'});

})
```


#### decode cookie
sicarii has two methods for returning a deserialized cookies object
```js

router.get('/', function(stream, headers, flags){

  // return cookies object ~ config.cookie_parser.auto_parse
  console.log(stream.cookies)

  // manual return cookies object
  console.log(app.cookie_decode(headers['cookie']))

});

```


## template engines
documentation tbc
## ip blacklist
documentation tbc
## ip whitelist
documentation tbc
## auth-token
documentation tbc
## cache
documentation tbc
## mem-cache
documentation tbc
## compression
documentation tbc
## static file server
documentation tbc
## logs
documentation tbc


...

[cd-img]: https://app.codacy.com/project/badge/Grade/d0ce4b5a5c874755bb65af1e2d6dfa87
[npm-img]: https://badgen.net/npm/v/sicarii?style=flat-square
[dep-img]:https://badgen.net/david/dep/angeal185/sicarii?style=flat-square
[sz-img]:https://badgen.net/packagephobia/publish/sicarii?style=flat-square
[lic-img]: https://badgen.net/github/license/angeal185/sicarii?style=flat-square
[syn-img]: https://snyk.io.cnpmjs.org/test/npm/sicarii
[npm-url]: https://npmjs.org/package/sicarii
