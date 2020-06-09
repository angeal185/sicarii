# sicarii
The zero dependency http2 nodejs framework

![cd-img] ![dep-img] ![syn-img] ![sz-img]

[![NPM Version][npm-img]][npm-url] ![lic-img]

### Installation

npm

```sh
$ npm install sicarii --save
```

git
```sh
$ git clone https://github.com/angeal185/sicarii.git
```

### api

```js

const { server, router } = require('sicarii');




// build new project in cwd()
server.build()

//api methods

// get stream
router.get('/test', function(stream, headers, flags){
  let query = stream.query; //json object

  stream.headers['Content-Type'] = 'application/json';

  stream.respond(stream.headers);

  stream.json({test: 'ok'});
  //stream.end('some text')
});

// connect stream
router.connect('/test', function(stream, headers, flags){
  let query = stream.query;


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


// cookies

router.get('/', function(stream, headers, flags){
  //add cookie to stream.headers
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



//start http2 server
server.listen(8080);



// tbc
```

### configuration

```js
//defaults

{
  "port": "8080", // server port
  "origin": "https://localhost", // server origin
  "verbose": true, // show log to console
  "proxy": false, // behind a proxy/reverse proxy?
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
  "base_build": { // enable server.build() method
    "enabled": false
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

[cd-img]: https://app.codacy.com/project/badge/Grade/d0ce4b5a5c874755bb65af1e2d6dfa87
[npm-img]: https://badgen.net/npm/v/sicarii?style=flat-square
[dep-img]:https://badgen.net/david/dep/angeal185/sicarii?style=flat-square
[sz-img]:https://badgen.net/packagephobia/publish/sicarii?style=flat-square
[lic-img]: https://badgen.net/github/license/angeal185/sicarii?style=flat-square
[syn-img]: https://snyk.io.cnpmjs.org/test/npm/tweekdb
[npm-url]: https://npmjs.org/package/sicarii
