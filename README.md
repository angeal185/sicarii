# sicarii
The zero dependency http2 nodejs multithread framework

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

### About
tbc
### Initialization

As sicarii is built for http2, SSL certificates are required.
The default path for the ssl certificates is as follows:

* `./cert/localhost.cert`
* `./cert/localhost.key`

These options be edited in the default `./config/config.json` file at `config.server`.
`config.server` accepts all of the same default arguments as nodejs http2 config.

* for using the `key/cert/pfx/ca` options, a path to the file should be provided as the arg.

#### First run

```js

const { server } = require('sicarii');
// server is master

```

Upon first run and if not found, sicarii will attempt to generate the following.
* `./config` ~ default config directory.
* `./config/config.json` ~ default config file.
* `./config/ip_config.json` ~ default ip whitelist/blacklist file.

this action is sandboxed for security reasons and will only work when server is master.

#### build

```js

const { server } = require('sicarii');
// server is master
server.build();
```
Upon successful completion of first run, you can optionally build the default sicarii skeleton.
`server.build()` will add the following to your cwd
* `./render` ~ default render/document directory.
* `./render/index.html` ~ starter html file.
* `./static` ~ default static file directory.
* `./static/css/main.css` ~ starter css file.
* `./static/modules/main.mjs` ~ starter mjs file.

this action is sandboxed for security reasons and will only work when server is master.

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


### router

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


### configuration

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

### app
tbc
### body parser
tbc
### cookie parser
tbc
### template engines
tbc
### blacklist
tbc
### whitelist
tbc
### auth-token
tbc
### cache
tbc
### compression
tbc

[cd-img]: https://app.codacy.com/project/badge/Grade/d0ce4b5a5c874755bb65af1e2d6dfa87
[npm-img]: https://badgen.net/npm/v/sicarii?style=flat-square
[dep-img]:https://badgen.net/david/dep/angeal185/sicarii?style=flat-square
[sz-img]:https://badgen.net/packagephobia/publish/sicarii?style=flat-square
[lic-img]: https://badgen.net/github/license/angeal185/sicarii?style=flat-square
[syn-img]: https://snyk.io.cnpmjs.org/test/npm/sicarii
[npm-url]: https://npmjs.org/package/sicarii
