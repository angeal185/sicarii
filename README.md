![](https://i.ibb.co/GcZZgw0/SICARII-1280.png)

The zero dependency http2 nodejs multithreading framework

![cd-img] ![dep-img] ![sz-img]

[![NPM Version][npm-img]][npm-url] ![lic-img]

# [SICARII Website](https://angeal185.github.io/sicarii/)

# [SICARII Dev Wiki](https://github.com/angeal185/sicarii/wiki)

# Documentation

- [Installation](#installation)
- [About](#about)
- [Initialization](#initialization)
- [build](#build)
- [server](#server)
- [sync](#sync)
- [router](#router)
- [configuration](#configuration)
- [stream](#stream)
- [push handler](#push-handler)
- [headers](#headers)
- [app](#app)
- [body parser](#body-parser)
- [etags](#etags)
- [cookie parser](#cookie-parser)
- [template engines](#template-engines)
- [botnet](#botnet)
- [ip blacklist](#ip-blacklist)
- [ip whitelist](#ip-whitelist)
- [auth-token](#auth-token)
- [cache](#cache)
- [store](#store)
- [sessions](#sessions)
- [compression](#compression)
- [static file server](#static-file-server)
- [MIME types](#mime-types)
- [logs](#logs)
- [crypt](#crypt)
- [backwards-compatibility](#backwards-compatibility)


# Installation
- [Back to index](#documentation)

npm

stable release

```sh
$ npm install sicarii --save
```

dev release

git
```sh
$ git clone https://github.com/angeal185/sicarii.git
```

# About
- [Back to index](#documentation)

Sicarii is a nodejs http2 framework for projects of all sizes.

* zero dependencies forever
* multithreading by default
* does not need or use the nodejs http2 compatibility layer api but can be extended to do so
* non restrictive design in that you can use the sicarii api or vanilla nodejs most of the time
* easily extendable

# Initialization
- [Back to index](#documentation)

As sicarii is built for http2, SSL certificates are required.
The default path for the ssl certificates is as follows:

* `./cert/localhost.cert`
* `./cert/localhost.key`

These options be edited in the default `./config/config.json` file at `config.ssl`.
* for using the `key/cert/pfx/ca` options, a path to the file should be provided as the arg.
* `config.server` accepts all of the same default arguments as nodejs http2 server config.
* sicarii will automatically combine `config.ssl` with `config.server`

self signed certificates can be used for development and created as follows:

ECDSA

```bash

$ openssl ecparam -name secp384r1 -genkey -out localhost.key
$ openssl req -new -x509 -key localhost.key -out localhost.cert -days 365

```

RSA

```bash

$ openssl req -x509 -new -x509 -sha256 -newkey rsa:4096 -nodes -keyout localhost.key -days 365 -out localhost.cert

```


# Build
- [Back to index](#documentation)

run the following line of code in any file inside your cwd to build sicarii.

```js

require('sicarii/build')();

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
* `./uploads` ~ default upload directory.
* `./logs` ~ default logs directory.
* `./store/cache` ~ default cache write dir.
* `./store/session` ~ default session write dir.
* `./store/store` ~ default store write dir.

this action is sandboxed for security reasons. should you wish to, you can delete the associated build files:

* `/sicarii/build.js`
* `/sicarii/lib/utils/init.js`

```js

const { app } = require('sicarii');

app.del_build()

```

# Server
- [Back to index](#documentation)

Sicarii is built to incorporate  multi-threading by default. you can edit your thread count at `config.cluster.workers`

Although many frameworks wrap the server object within their app, limiting your server actions to those they
wish you to have access to, sicarii does not.
sicarii extends the existing nodejs modules in place, leaving you full access to the nodejs server object.
Most of these extensions can be either disabled, replaced, configured or extended.

sicarii uses the modern nodejs http2 api and does not need or contain any code related to the
http2 Compatibility API.

Below is a 30 second minimal `rest-api`/`static server` example.

```js
const { app, cluster } = require('sicarii');
// app is always called first

if (cluster.isMaster) {

  const { sync, Cache, server, logs } = require('sicarii/master');


  // Cache extentions here ~ if any

  // server extentions here ~ if any

  // logs extentions here ~ if any

  // * spawn workers
  // * synchronize master/worker communication
  // * respawn dead workers
  // * start cache on config.cache.port cache port
  // * automatically handle cache requests
  // * automatically handle log requests

  sync.init().respawn().listen();

} else {

  const { server, router, crypt } = require('sicarii/main');

  // serve static
  router.get('/', function(stream, headers, flags){

    stream.addHeaders({
      header2: 'ok2',
      header3: 'ok3'
    });


    //stream headers and and send static document
    stream.doc('index.html', 'text/html; charset=utf-8');

  });

  // json rest
  router.post('/', function(stream, headers, flags){
    let body = stream.body.json;

    stream.addHeader('x-Static', 'ok');

    // send headers & response
    stream.json({key: 'val'});
  });

  //start worker server at config.port
  server.listen(app.config.port);
}
```

#### server.log_ip()
refer to logs for a detailed explanation

log ip address

```js

/**
 *  @server.log_ip(ip, path)
 *
 *  @param {string} ip ~ ip address to log
 *  @param {string} path ~ path to log
 **/

router.get('/login', function(stream, headers, flags){

  server.log_ip(stream.ip, '/login')

});

```

#### server.log_history()
refer to logs for a detailed explanation

log history

```js

/**
 *  @server.log_history(data)
 *
 *  @param {string} data ~ history data to log
 **/

 router.get('/login', function(stream, headers, flags){

   let his_log = [Date.now(), 'GET', '/login'].join('::::')
   server.log_history(his_log)

 });

```

#### server.log_error()
refer to logs for a detailed explanation

log error

```js

/**
 *  @server.log_error(data)
 *
 *  @param {string} data ~ error data to log
 **/

 router.get('/someerror', function(stream, headers, flags){

   let his_log = [Date.now(), 'GET', '/someerror', '400', 'some message'].join('::::')
   server.log_error(his_log)

 });

```

#### server.pre_cache()
server.pre_cache() will enable you to pre-cache your static files/docs.

* this method can only be called once and upon doing so, it will remove itself
* this method is apart of `sync` although you may have many workers, it will only be called once.
* this method is for static files/docs only, it is not intended for rendered docs
* `config.pre_cache` is the path to your pre_cache config file
* `config.verbose` enabled will log to console the cache status of a streamed file

the configuration file can be configured like so:

```js
/* ./config/pre_cache.json */

{
  "render": [{
    "ctype": "text/html", // file content-type 'only'
    "url": "/index.html"  // file path relative to render path
  }],
  "static": [{
    "ctype": "text/css",
    "url": "/css/main.css" // file path relative to static path
  },{
    "ctype": "application/javascript",
    "url": "/modules/main.mjs"
  }]
}

```

the method can be called like so:

```js
const { app, cluster } = require('sicarii');


if(cluster.isMaster) {

  const { sync } = require('sicarii/master');

  sync.init().respawn().listen();


} else {

  const { server, router } = require('sicarii/main');

  router.get('/', function(stream, headers, flags){

    // stream.doc() static files are located in the render folder
    // this file has been cached
    // [sicarii:GET] /index.html 200 [cache]
    stream.status(200).doc('index.html', 'text/html')

    // stream.render() files are located in the render folder but are not static
    // this has not been rendered/cached properly
    // do not pre-cache rendered files
    stream.status(200).render('index.html', {not: 'cached'})

  });

  // can be optionally called in chain
  // sync will ensure the method is only called by first worker
  server.pre_cache().listen(app.config.port);

}
```

#### server.push_handler()
refer to push handler

server.push_handler() will enable/disable automatic stream push of static files.
* this method takes priority over `config.push_handler.enabled`

```js
const { app, cluster } = require('sicarii');

if(cluster.isMaster) {

  const { sync } = require('sicarii/master');

  sync.init().respawn().listen();

} else {

  const { server, router } = require('sicarii/main');

  router.get('/', function(stream, headers, flags){
    stream.status(200).doc('index.html', 'text/html')
  });

  //enable push_handler manually
  server.pre_cache().push_handler(true).listen(app.config.port);
}

```

# Sync
- [Back to index](#documentation)

the sync object is is used to control and synchronize events between master/worker

* sync is optionally responsible for all tasks related to the cluster module
* sync will automatically handle spawning of new worker threads
* sync will automatically handle respawning of crashed worker threads
* sync will automatically handle inter-process messaging across all processes
* sync will automatically initialize Cache and start the cache server
* sync will handle inter-process ip/history/error logging
* sync is a part of the master scope


#### sync.init()


```js

/**
 *  sync.listen(settings)
 *  @param {object} settings // optional worker settings overrides to config.cluster.settings
 **/

if (cluster.isMaster) {
  const { sync } = require('sicarii/master');

  // * spawn workers
  // * synchronize master/worker communication
  sync.init();
}
```

#### sync.respawn()

```js
if (cluster.isMaster) {
  const { sync } = require('sicarii/master');

  // * respawn dead workers
  sync.respawn()

  // or
  sync.init().respawn()
}
```

#### sync.listen()

```js
/**
 *  sync.listen(callback)
 *  @param {function} callback // optional callback
 **/

if (cluster.isMaster) {
  const { sync } = require('sicarii/master');

  // * start cache on config.cache.port cache port
  sync.listen()

  // or
  sync.init().respawn().listen()
}
```

#### sync.kill()

```js
/**
 *  sync.kill(id)
 *  @param {number} id // id of the worker to kill
 **/

if (cluster.isMaster) {
  const { sync } = require('sicarii/master');

  sync.init().respawn().listen()

  // kill worker with id 1 then worker with id 2
  // with sync.respawn() active these workers will be respawned
  setTimeout(function(){
    sync.kill(1).kill(2)
  },5000)
}
```

#### sync.kill_all()

```js
if (cluster.isMaster) {
  const { sync } = require('sicarii/master');

  sync.init().respawn().listen()

  // kill all workers
  // with sync.respawn() active these workers will be respawned
  setTimeout(function(){
    sync.kill_all(1)
  },5000)
}
```

# Router
- [Back to index](#documentation)

#### methods

The default allowed router methods can and should be configured at `config.stream.methods`.
* `config.stream.methods` accepts all compatible http methods. you should only add the ones you use.
* `config.stream.method_body` contains all of the router methods that accept a body.
* `config.stream.method_query` contains all of the router methods that accept a query string.

* If you are not using a method in your app, you should remove it to improve both the security and performance of your app.

the router also accepts all of the default nodejs stream methods.

below listed are some basic router method examples:
```js

/**
 *  router[event](path, callback)
 *  @param {string} path
 *  @param {function} callback ~ function(stream, headers, flags)
 **/

router.get('/test', function(stream, headers, flags){
  let query = stream.query; //json object

  // add header
  stream.addHeader('Content-Type', 'application/json');

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

  // send headers & response
  stream.json({test: 'get'});

  /* or using default nodejs methods */

  stream.respond(stream.headers);
  stream.end(JSON.stringify({test: 'get'}))

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

  stream.addHeader('key', 'val');

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


# Configuration
- [Back to index](#documentation)

sicarii has a tiny but powerful list of configurations

the configuration file at `./config/config.json` is an essential part of sicarii.
you MUST tweak it to your own requirements in order to maximize performance and security.

```js
//defaults

{
  "port": 8080, // server port
  "origin": "https://localhost", // server origin
  "verbose": true, // show log to console
  "dev": true, // log errors to console
  "proxy": false, //  x-forwarded-for as ip address
  "ip_config": "/config/ip_config", // path to ip_config.json
  "pre_cache": "/config/pre_cache", // path to pre_cache.json
  "push_handler": { // automatic push handler
    "enabled": true,
    "accept": ["text/html"], // accept header document types to accept
    "path": "/config/push" // path to push config file
  },
  "cluster": {
    "workers": 2 // worker count
    "settings": { //worker settings
      "serialization": "json"
    }
  },
  "sync": {
    "respawn": true // auto-respawn dead workers
  },
  "session": {
    "path": "/store/session/db.json", //read/write dir relative to cwd
    "maxage": 1000000, //maxage of sessions in ms
    "secret": "" //optional session secret
  },
  "cache": {
    "url":"https://localhost:5000", // cache server url
    "timeout": 5000, //cache response timeout ms
    "proxy": false, // x-forwarded-for as ip address
    "authtoken": { //cache auth-token header
      "enabled": false,
      "header": "X-Authtoken",
      "token": "12345"
    },
    "whitelist": { //cache server ip whitelist
      "enabled": true,
      "ip": ["::ffff:127.0.0.1"] //cache whitelisted ip addersses
    },
    "server": {
      //cache server config ~ accepts all nodejs http2 server settings
      "rejectUnauthorized": false
    },
    "headers": {
      //cache server outbound headers
    }
  },
  "cookie_parser": {
    "enabled": true, //enable cookie parser
    "auto_parse": true, //enable auto cookie parse
    "sig": {
      "hmac": "secret", // cookie sign hmac
      "prefix": "sig" // cookie sig prefix
    }
  },
  "stream": {
    "path_limit": 100, // stream path size limit ~ false to disable check
    "case_sensitive": true, // converts url pathnames to  lowercase if false
    "param_limit": 1000, // stream url search size limit ~ false to disable check
    "body_limit": 5000, // stream body size limit ~ false to disable check
    "methods": [ // add all allowed http  methods ~ remove if unused
      "get",
      "post",
      "connect",
      "put",
      "delete",
      "head"
    ],
    "querystring": true, // enable stream.qs
    "method_body": ["post", "delete", "patch", "put"], // methods return body
    "method_query": ["get","connect", "head", "options", "trace"],// methods return query params
    "content_types": [ // accepted body content-types ~ remove if unused
      "application/json",
      "text/plain",
      "multipart/form-data",
      "application/x-www-form-urlencoded"
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
  "server": {
    // accepts all http2 nodejs server options
  },
  "ssl": {
    "cert": "/cert/localhost.cert", // key/cert/pfx/ca as string path to file
    "key": "/cert/localhost.key"
  },
  "store": { // sicarri store
    "path": "/store/store/db.json" // read/write path relative to cwd
  },
  "uploads": {
    "enabled": true,
    "path": "/uploads", // uploads dir, relative to cwd()
    "recursive": true, //enable recursive folder creation
    "gzip": true, // compress file using gzip
    "brotli": false, // compress file using brotli
    "deflate": false, // compress file using deflate
    "mimetypes": {
      // accepted mimetypes
    },
    "max_filename": 30, // max filename length
    "max_filesize": 50000 // max upload content length
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
  "compression": {
    "gzip": { // gzip compression
      "enabled": true,
      "prezipped": false, // use pre-compressed files
      "ext": ".gz", // compressed file extention
      "setting": {} // accepts all nodejs gzip compression settings
    },
    "brotli": { // brotli compression
      "enabled": false,
      "prezipped": false, // use pre-compressed files
      "ext": ".br", // compressed file extention
      "setting": {} // accepts all nodejs brotli compression settings
    },
    "deflate": { // deflate compression
      "enabled": false,
      "prezipped": false, // use pre-compressed files
      "ext": ".dfl", // compressed file extention
      "setting": {} // accepts all nodejs deflate compression settings
    }
  },
  "cors": { // default stream.cors fallback
    "origin": '',        // string  | Access-Control-Allow-Origin
    "methods": '',       // string  | Access-Control-Allow-Methods
    "allow_headers": '', // string  | Access-Control-Allow-Headers
    "expose_headers": '',// string  | Access-Control-Expose-Headers
    "credentials": true, // boolean | Access-Control-Allow-Credentials
    "maxage": 9999       // number  | Access-Control-Max-Age
  },
  "csp": { // content security policy object
    "default": "default-src 'self'"
  },
  "feature_policy": { // feature policy object
    "default": "microphone 'none'; geolocation 'none'"
  },
  "logs": {
    "path": "/logs", //path to log dir
    "separator": "|", // log separator
    "logs":["error", "history","ip"],
    "cron": 86400000, // logs cronjob interval
    "console_error": false, //log to console log-related errors
    "compression": "gzip", // backup compression ~ gzip/deflate/brotli
    "encodeURIComponent": false, // encode log entries
    "error": {
      "enabled": true, // enable auto error logs
      "max_size": 5000, // log max file size
      "base_name": "error", //log file base name
      "ext": ".txt" //log file base extension
    },
    "history": {
      "enabled": true, // enable auto history logs
      "max_size": 5000, // log max file size
      "base_name": "history", //log file base name
      "ext": ".txt" //log file base extension
    },
    "ip": {
      "enabled": true, // enable ip logging
      "max_size": 5000, // log max file size
      "base_name": "ip", //log file base name
      "ext": ".txt" //log file base extension
      "log_time": true, // add timestamp to log
      "log_path": true // add path to log
    }
  },
  "template_engine": { // template engine config
    "engines": [
      "basic", "poorboy", "nunjucks", "ejs", "pug",
      "mustache", "twig", "squirrelly", "ect", "eta",
      "liquidjs"
    ],
    "basic": {
      "enabled": true,
      "settings": {
        "pretty": false,
        "filters": {},
        "cache": false
      }
    },
    "squirrelly": {
      "enabled": false,
      "settings": {}
    },
    "eta": {
      "enabled": false,
      "settings": {}
    },
    "liquidjs": {
      "enabled": false,
      "settings": {
        "extname": ".liquid"
      }
    },
    "ect": {
      "enabled": false,
      "settings": {
        "cache": false,
        "open": "<%",
        "close": "%>"
      }
    },
    "poorboy": {
      "enabled": false,
      "settings": {
        "use_globals": false,
        "globals": {}
      }
    },
    "nunjucks": {
      "enabled": false,
      "jinjacompat": true,
      "filters": "",
      "globals": {
        "enabled": false,
        "vars": {}
      },
      "settings": {
        "autoescape": true,
        "noCache": true,
        "throwOnUndefined": false,
        "trimBlocks": false,
        "lstripBlocks": false,
        "tags": {}
      }
    },
    "ejs": {
      "enabled": false,
      "settings": {}
    },
    "pug": {
      "enabled": false,
      "settings": {
        "pretty": false,
        "filters": {},
        "cache": false
      }
    },
    "mustache": {
      "enabled": false,
      "tags": ["{{", "}}"],
      "settings": {}
    },
    "twig": {
      "enabled": false,
      "settings": {}
    }
  },
  "mimetypes": {
    // a list of all your allowed mimetypes
  },
  "crypt": {
    "jwt":{
      "secret": "secret", // jwt secret for hmac
      "digest": "sha256", // jwt digest for hmac
      "encode": "base64", // jwt encoding
      "separator": ":", // jwt token separator
      "header": { // jwt header
        "typ": "JWT",
        "alg": "HS256"
      },
      "claims": {
        "iss": "token issuer", // optional jwt issuer
        "sub": "token subject", // optional jwt subject
        "aud": "token audience", // optional jwt audience
        "exp": 5000000, // mandatory ms till expires
        "nbf": 0 // optional ms till valid
      }
    },
    "hmac": {
      "secret": "secret",  // hmac secret
      "digest": "sha3-512", // hmac hash function
      "encode": "hex" // output encode
    },
    "pbkdf2": {
      "digest": "sha3-512", // hash function
      "encode": "hex", // output encode
      "iterations": 50000 // kdf iterations
    },
    "scrypt": {
      "encode": "hex", // output encode
      "cost": 16384, // scrypt cost
      "blockSize":8, // scrypt cost
      "parallelization": 1 // scrypt parallelization
    },
    "encryption": {
      "secret": "", // encrypt/decrypt ~ app secret
      "secret_len": 32, // correct key length
      "iterations": 60000, // iterations to be used in keygen
      "digest": "sha3-512", // digest to be used in keygen
      "settings": { // THESE SETTINGS MUST BE VALID
        "cipher": "aes", // encrypt/decrypt cipher
        "bit_len": "256", // encrypt/decrypt bit
        "iv_len": 32, // encrypt/decrypt iv length
        "tag_len": 16, // encrypt/decrypt auth-tag length
        "encode": "hex", // encrypt/decrypt/keygen encoding
        "mode": "gcm" // encrypt/decrypt mode
      }
    },
    "ecdsa": {
      "curve": "secp521r1", // ecdsa curve
      "encode": "hex", // ecdsa encoding
      "hash": "sha3-512", // ecdsa hash used
      "privateKey": {  // accepts all nodejs ec privateKey settings
        "type": "sec1",
        "format": "der"
      },
      "publicKey": { // accepts all nodejs ec publicKey settings
        "type": "spki",
        "format": "der"
      }
    },
    "ecdh": { // ecdh key exchange
      "curve": "secp521r1",  // ecdh curve
      "encode": "hex"  // ecdh encoding
    },
    "rsa": { // rsa encryption
      "length": 4096, // rsa modulusLength
      "publicExponent": 65537,
      "encode": "hex",
      "oaepHash": "sha512", // rsa oeap hash used
      "publicKey": { // accepts all nodejs rsa publicKey settings
        "type": "pkcs1",
        "format": "pem"
      },
      "privateKey": { // accepts all nodejs rsa privateKey settings
        "type": "pkcs8",
        "format": "pem"
      }
    },
    "otp": { // contains the one time pad defaults
      "rounds": 1, // otp encrypt/decrypt rounds count
      "iterations": 10000, // iteration count for generating a secure pad
      "digest": "sha512", // digest used for generating a secure pad
      "encode": "hex" // encoding used for otp
    }
  },
  "bot": {
    "detect": {
      "items": ["Googlebot"] // manual detect bots via user-agent sub-string
    },
    "block": {  // automatically block bots via user-agent sub-string
      "enabled": false,
      "msg": "Unauthorized", // bot block msg
      "items": [] // blocked bots array
    }
  }
}

```

# Stream
- [Back to index](#documentation)

accepts all nodejs methods and the following:

#### stream.doc(src, content-type)

stream doc will serve a document from the render folder
* this method will use cache if available
* this method will use compression if available
* this method will stream respond headers
* this method will send default headers from `config.render.headers`
* this method will use etag settings from `config.render.etag`
* this method will use cache settings from `config.render.cache`
* this method will use gzip/brotli/deflate settings from `config.compression`

```js

/**
 *  stream.doc(path, contentType, callback)
 *  @param {string} path // file path relative to render dir
 *  @param {string} contentType // file content-type
 *  @param {function} callback ~ optional
 **/

  router.get('/', function(stream, headers, flags){

    // send response headers and render static document from the render dir
    stream.doc('index.html', 'text/html; charset=utf-8');

  });
```

#### stream.render(src, data)

stream render will serve a rendered document from the render folder.
refer to template engines.

* this method will use cache if available
* this method will use compression if available
* this method will stream respond headers
* this method will send default headers from `config.render.headers`
* this method will use etag settings from `config.render.etag`
* this method will use cache settings from `config.render.cache`
* this method will use gzip/brotli/deflate settings from `config.compression`

```js

/**
 *  stream.render(path, obj, callback)
 *  @param {string} path // file path relative to render dir
 *  @param {object} obj // data for rendered file
 *  @param {function} callback ~ optional
 **/

  router.get('/', function(stream, headers, flags){

    // basic ~ default: uses template literals in html documents
    stream.render('index.html', {title: 'basic'})

    // nunjucks ~ requires manual installation of nunjucks
    stream.render('index.njk', {title: 'nunjucks'})

    // pug ~ requires manual installation of pug
    stream.render('index.pug', {title: 'pug'})

  });

```

#### stream.pushStatic(path, ctype)

stream pushStatic will push a file or files from the static folder before requested.

* this method can be chained to push multiple files
* this method will use cache if available
* this method will use compression if available
* this method will send default headers from `config.static.headers`
* this method will use etag settings from `config.static.etag`
* this method will use cache settings from `config.static.cache`
* this method will use gzip/brotli/deflate settings from `config.compression`
* `config.verbose` will log the push state of a file
* this method is asynchronous so the `stream` object is immediately returned
* any errors are handled by sicarii in the same manner as the static file server

```js

/**
 *  stream.pushStatic(path, ctype) // single file
 *  @param {string} path // file path relative to static dir as it would be requested as
 *  @param {string} ctype // file content type as it would be requested as
 *
 *  stream.pushStatic(obj) // multiple files
 *  @param {object} obj // obj.path: file path, obj.ctype: content-type
 **/

  router.get('/', function(stream, headers, flags){
    /* push files to the browser before the browser requests them */

    // push a file before it has been requested
    stream
    .pushStatic('/css/main.css', 'text/css')
    .status(200)
    .doc('index.html', 'text/html')

    // or push multiple files before they have been requested

    stream
    .pushStatic([{
      path: '/css/main.css', // file path
      ctype: 'text/css' // file content type
    },{
      path: '/favicon.ico',
      ctype: 'image/x-icon'
    }])
    .status(200)
    .render('index.html', {test: 'push'}, function(err){
      if(err){return console.error(err)}
    })

  });

```

#### stream.download(file, content-type)
stream.download will initiate a file download upon browser navigation.

* stream.download uses `config.static` settings
* this method will use cache if available
* this method will use compression if available
* this method will stream respond headers
* this method will send default headers from `config.static.headers`
* this method will use etag settings from `config.static.etag`
* this method will use cache settings from `config.static.cache`
* this method will use gzip/brotli/deflate settings from `config.compression`
* this method will Content-Disposition 'attachment; filename="the files name"' to the headers;

```js

/**
 *  stream.download(path, contentType, callback)
 *  @param {string} path // file path relative to static dir
 *  @param {string} contentType // file content-type
 *  @param {function} callback ~ optional
 **/

router.get('/downloadpath', function(stream, headers, flags){
  // main.mjs will download when /downloadpath is navigated to in the browser
  stream.download('modules/main.mjs', 'application/javascript');

});
```


#### stream.upload(object, callbabk)

stream.upload will upload a file to your uploads dir if enabled at `config.uploads.enable`


* `config.uploads.gzip` will enable/disable gzip compression for uploads
* `config.uploads.brotli` will enable/disable brotli compression for uploads
* `config.uploads.deflate` will enable/disable deflate compression for uploads
* `config.uploads.path` is your upload path relative to cwd()
* `config.uploads.recursive` will enable recursive dir creation within `config.uploads.path`,
* `config.uploads.mimetypes` should list all accepted upload mimetypes in the same format as `config.mimetypes`
* `config.uploads.max_filename` max filename length
* `config.uploads.max_filesize` max content length

simple upload example:

```js

/**
 *  stream.upload(settings, callback)
 *  @param {object} settings // upload settings
 *  @param {function} callback ~  function(err,res) | optional
 **/

router.post('/upload', function(stream, headers, flags){
    let ctype = headers.get('content-type');

    if(ctype !== 'application/json'){
      // do something
    }

    try {
      let body = JSON.stringify(stream.body.json);

      let upload_data = {
        path: '/test/index.json', // path relative to uploads dir
        ctype: ctype, // content type
        data: body, // data as string
        brotli: true, //override default brotli setting config.uploads.brotli ~ optional
        gzip: false //override default gzip setting config.uploads.gzip ~ optional
        //deflate: false //override default deflate setting config.uploads.deflate ~ optional
      }

      stream.upload(upload_data, function(err,res){
        if(err){
          // do something
          return;  
        }

        stream.json({upload: 'success'})

      })
    } catch (err) {
      // do something
    }

});
```

#### stream.json(data)

stream.json() performs the following actions:

* add content-type 'application/json' to the headers;
* stream the headers object.
* send stringified json

```js

/**
 *  stream.json(obj, contentType, callback)
 *  @param {array/object} obj // data to be stringified
 *  @param {function} callback ~ optional
 **/

router.get('/', function(stream, headers, flags){

  stream.json({send: 'json'})

});

```


#### stream.redirect(dest)

stream.redirect() performs the following actions:

* add location destination to the headers;
* stream the headers object.
* send redirect

```js

/**
 *  stream.redirect(path)
 *  @param {string} path // redirect anywhere path
 **/

router.get('/', function(stream, headers, flags){
  //redirect to url
  stream.redirect('/test')

});

```

#### stream.ip

stream.ip returns the client ip address

* enable config.proxy to return ['x-forwarded-for'] ip

```js

router.get('/', function(stream, headers, flags){

  console.log(stream.ip)
  // xxx.xxx.x.x.x

});

```

#### stream.headers

stream.headers will return an object containing all current and default outbound headers;
this is not to be mistaken with the received `headers` object;
```js
router.get('/', function(stream, headers, flags){

  //log default received headers to console
  console.log(headers.all())

  //log default outbound headers to console
  console.log(stream.headers)

  // add outbound header
  stream.addHeader('Content-Type', 'text/plain');

  stream.respond(stream.headers);
  stream.end('headers sent')

})

```

#### stream.addHeader()

stream.addHeader(key,val) will add a header to `stream.headers`

```js

/**
 *  stream.addHeader(key, val)
 *  @param {string} key // header type
 *  @param {string} val // header value
 **/

router.get('/', function(stream, headers, flags){

  // add outbound header
  stream.addHeader('Content-Type','text/plain');
  //stream.headers['Content-Type'] = 'text/plain';

  stream.respond(stream.headers);
  stream.end('headers sent')

})

```

#### stream.addHeaders()

stream.addHeaders(obj) will assign an object of headers to `stream.headers`

```js

/**
 *  stream.addHeaders(key, val)
 *  @param {object} obj // headers object
 **/

router.get('/', function(stream, headers, flags){

  // add outbound header
  stream.addHeaders({
    'content-type':'text/plain',
    'content-encoding': 'gzip'
  });

  stream.respond(stream.headers);
  stream.end('headers sent')

})

```

#### stream.cors()

stream.cors() will add the included cors options to `stream.headers`
* this method will override any default cors headers in `config.render.headers` || `config.static.headers`
* this method will fallback to `config.cors` if no object is provided

```js

/**
 *  stream.cors(obj)
 *  @param {object} obj // optional | cors entries || fallback to config.cors
 **/

router.get('/', function(stream, headers, flags){

  // add all outbound cors headers
  stream.cors({
    origin: '',        // string  | Access-Control-Allow-Origin
    methods: '',       // string  | Access-Control-Allow-Methods
    allow_headers: '', // string  | Access-Control-Allow-Headers
    expose_headers: '',// string  | Access-Control-Expose-Headers
    credentials: true, // boolean | Access-Control-Allow-Credentials
    maxage: 9999       // number  | Access-Control-Max-Age
  });

  // or only some
  stream.cors({
    origin: '',
    methods: '',
    allow_headers: ''
  });

  // or use config.cors
  stream.cors();

  stream.respond(stream.headers)

  stream.end('text')
})

```

#### stream.ctype()

stream.ctype(val) will add the Content-Type header to `stream.headers`

```js

/**
 *  stream.ctype(val)
 *  @param {string} val // header value
 **/

router.get('/', function(stream, headers, flags){

  // add outbound Content-Type header
  stream.ctype('text/plain');

  stream.respond(stream.headers)

  stream.end('text')
})

```

#### stream.lang()

stream.lang(val) will add the Content-Language header to `stream.headers`

```js

/**
 *  stream.lang(val)
 *  @param {string} val // header value
 **/

router.get('/', function(stream, headers, flags){

  // add outbound Content-Language header
  stream.lang('en-US');

  stream.respond(stream.headers)

  stream.end('text')
})

```

#### stream.tk()

stream.tk(val) will add the TK header to `stream.headers`

```js

/**
 *  stream.tk(val)
 *  @param {string} val // header value
 **/

router.get('/', function(stream, headers, flags){

  /*
  Tk: !  (under construction)
  Tk: ?  (dynamic)
  Tk: G  (gateway or multiple parties)
  Tk: N  (not tracking)
  Tk: T  (tracking)
  Tk: C  (tracking with consent)
  Tk: P  (potential consent)
  Tk: D  (disregarding DNT)
  Tk: U  (updated)
  */

  // add outbound TK header
  stream.tk('N');

  stream.respond(stream.headers)

  stream.end('text')
})

```

#### stream.csp()

stream.csp(val) will add the Content-Security-Policy header to `stream.headers`

* stream.csp will load the csp from `config.csp`;
* this method enables you to store and use multiple pre-defined content security policies

```js

/**
 *  stream.csp(val)
 *  @param {string} val // header value
 **/

router.get('/', function(stream, headers, flags){

  // add outbound Content-Security-Policy header from `config.csp.default`
  stream.csp('default');

  stream.respond(stream.headers)

  stream.end('text')
})

```

#### stream.feature()

stream.feature(val) will add the Feature-Policy header to `stream.headers`

* stream.feature will load the Feature-Policy from `config.feature_policy`;
* this method enables you to store and use multiple pre-defined feature policies

```js

/**
 *  stream.feature(val)
 *  @param {string} val // header value
 **/

router.get('/', function(stream, headers, flags){

  // add outbound Feature-Policy header from `config.feature_policy.default`
  stream.feature('default');

  stream.respond(stream.headers)

  stream.end('text')
})

```

#### stream.status()

stream.status(val) will set the :status header to `stream.headers`

```js

/**
 *  stream.status(val)
 *  @param {number} val // header value
 **/

router.get('/', function(stream, headers, flags){

  // add outbound :status header
  stream.status(200).ctype('text/plain').respond(stream.headers);

  stream.end('text')
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
#### stream.qs

stream.qs is similar to `stream.query` but returns the unparsed querystring.
This method is intended for use with custom or complex querystrings;

* `config.stream.querystring` enable/disable
* the returned querystring is decoded with decodeURIComponent()

```js
router.get('/test', function(stream, headers, flags){
  let customquery = stream.qs;
  console.log(customquery)

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

stream.cookie will enable you to easily access all cookies in `headers`
* this method automatically deserializes all cookies.
* this method requires `config.cookie_parser.enabled` to be enabled
* this method can be enabled/disabled at `config.cookie_parser.auto_parse`

```js
router.get('/', function(stream, headers, flags){

  // return cookies object ~ config.cookie_parser.auto_parse
  console.log(stream.cookies)

})
```

#### stream.cookie()

this method is a part of cookie parser
refer to cookie parser

stream.cookie(name,val,obj) will enable you to easily add cookies to the `stream.response`
* this method automatically adds the created cookie to `stream.headers`
* this method can be enabled/disabled at `config.cookie_parser.enabled`
* this method can create a separate signed cookie for tamper detection
* `config.cookie_parser.sig.secret` is used to hmac the cookie
* `config.cookie_parser.sig.suffix` is the signed cookies suffix
* a signed cookie will be will use digest/encode settings from `config.crypt.hmac`


```js

/**
 *  stream.cookie(key, val, settings)
 *  @param {string} key // cookie name
 *  @param {string} val // cookie value
 *  @param {object} settings // cookie settings
 **/

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
    Priority: 'High',
    Signed: true // creates a separate suffixed signed cookie for validation
  })

  stream.respond(stream.headers);
  stream.end()

})
```

# push handler
- [Back to index](#documentation)

the push handler will enable/disable automatic stream push of static files.

upon stream, the server will search the accepted header for a match in `config.push_handler.accepted`
and will push your selected files with the document

* `config.push_handler.enabled` enables this method
* this method is for static `files` only e.g js/css/png/jpg
* this method is not for rendered/static `documents` e.g html/xhtml/xml
* this method is for `GET` requests only.
* `config.push_handler.accepted` should contain the `requested paths` content-type e.g text/html
* `config.push_handler.accepted` should not contain the pushed items content-type e.g text/css
* `config.push_handler.accepted` should only contain document content-types that you use
* `config.push_handler.accepted` should be as small as possible
* automatic stream push of static files is recommended only for push intensive sites

the push configuration file can be configured like so:

```js
/* ./config/push.json */


[{
  "url": "/single_push", // the url path that the file is to be pushed for
  "ctype": "text/css",   // file content-type 'only'
  "path": "/css/main.css" // file path relative to static path
},{
  "url": "/multi_push",
  "items": [{ // push multiple items at same url
    "ctype": "text/css",
    "path": "/css/main.css"
  },{
    "ctype": "image/x-icon",
    "path": "/favicon.ico"
  }]
}]


```


```js

router.get('/single_push', function(stream, headers, flags){
  // will automatically push a static file and send headers/doc

  stream.status(200).doc('index.html', 'text/html')
});

router.get('/multi_push', function(stream, headers, flags){
  // will automatically push multiple static files and send headers/doc

  stream.status(200).doc('index.html', 'text/html')
});

router.get('/manual_push', function(stream, headers, flags){
  // will not automatically push multiple static files


  stream // manually push multiple static files and send headers/doc
  .pushStatic([{
    path: '/css/main.css', // file path
    ctype: 'text/css' // file content type
  },{
    path: '/favicon.ico',
    ctype: 'image/x-icon'
  }])
  .status(200)
  .doc('index.html', 'text/html')
});

```

# Headers
- [Back to index](#documentation)

the headers object includes the following methods:

#### headers.all()

headers.all() will return a valid json object containing all received headers

```js

router.get('/', function(stream, headers, flags){

  // log all received headers
  console.log(headers.all())

})
```

#### headers.get()

headers.get() will return a header from the headers object in nodejs http2 format

```js

/**
 *  headers.get(key)
 *  @param {string} key // header name
 **/

router.get('/', function(stream, headers, flags){

  // return content-type header
  console.log(headers.get('content-type'))

})
```

#### headers.is()

headers.is() will return a boolean if the header is equal to the comparison

```js

/**
 *  headers.is(key, val)
 *  @param {string} key // header name
 *  @param {string} val // value to compare
 **/

router.get('/admin', function(stream, headers, flags){

  // check content-type
  if(!headers.is('x-token', 'secret')){
    app.blacklist(stream.ip)
  }

})

```

#### headers.has()

headers.has() will return a boolean if the header exists
* will also return true for header that exists and has a value of false or 0

```js

/**
 *  headers.has(key)
 *  @param {string} key // header name
 **/

router.get('/', function(stream, headers, flags){

  // check if cookie header exists
  if(headers.has('cookie')){
    console.log('cookie header exists')
  }

})

```

#### headers.cookies()

headers.cookies() will return a deserialized cookies json object

```js

router.get('/', function(stream, headers, flags){

  // return cookies object
  console.log(headers.cookies())

})

```

#### headers.ctype()

headers.ctype() will return the Content-type header if exists

```js

router.get('/', function(stream, headers, flags){

  console.log(headers.ctype())
  // application/json ...

})

```

#### headers.agent()

headers.agent() will return the User-agent header if exists

```js

router.get('/', function(stream, headers, flags){

  console.log(headers.agent())
  // some browser user-agent ...

})

```

#### headers.bot()

headers.bot() will return true if the user-agent detected is a bot

* `config.bot.items` should contain an array of bots to check for
* this feature could be used to perform targeted seo optimization

```js

router.get('/', function(stream, headers, flags){


  if(headers.bot()){
    // render template containing seo data only
    let useragent = headers.ua();

    if(useragent.includes('google')){
      stream.render('index_seo_google.html', {
        data: {
          some: 'google data',
          specifically: 'relating',
          to: 'google seo'
        }
      })
    } else if(useragent.includes('facebook')) {
      stream.render('index_seo_facebook.html', {
        data: {
          some: 'facebook data',
          specifically: 'relating',
          to: 'facebook seo'
        }
      })
    } else {
      stream.render('index_seo_default.html', {
        data: {
          some: 'default data',
          specifically: 'relating',
          to: 'default seo'
        }
      })
    }
  } else {
    // render normal template not polluted with seo
    stream.render('index.html', {title: 'basic'})
  }


})

```

#### headers.encoding()

headers.encoding() will return the accept-encoding header if exists
* the returned value/s will be within a trimmed array

```js

router.get('/', function(stream, headers, flags){

  console.log(headers.encoding())
  // ['accepted', 'encoding']

})

```

#### headers.lang()

headers.lang() will return the accept-language header if exists
* the returned value/s will be within a trimmed array

```js

router.get('/', function(stream, headers, flags){

  console.log(headers.lang())
  // ['accepted', 'language']

})

```

#### headers.accept()

headers.accept() will return the accept header if exists
* the returned value/s will be within a trimmed array

```js

router.get('/', function(stream, headers, flags){

  console.log(headers.accept())
  // ['accepted', 'content', 'types']

})

```

#### headers.size()

headers.size() length of the headers object

```js

router.get('/', function(stream, headers, flags){

  let len = headers.size(); // headers length
  if(len > 1000){
    app.blacklist(stream.ip)
  }

})

```

#### headers.count()

headers.count() will return a count of your total headers

```js

router.get('/', function(stream, headers, flags){

  let len = headers.count(); // headers count
  if(len > 50){
    app.blacklist(stream.ip)
  }

})

```

# App
- [Back to index](#documentation)

the app object exists as a bridge between worker/master.


* app must be accessible outside of the worker/master scope
* all methods within app are available to the master and worker threads
* app contains a list of helper functions that might otherwise require dependencies


#### app.config

app.config gives you access to your current configuration vars throughout your app.

```js

console.log(app.config.port)

```

#### app.set()

app.set() will set environmental variables available to the scope in which they are called

```js
/**
 *  app.setEnv(key, val)
 *  @param {string} key //  
 *  @param {string|object|number|buffer} val
 **/

 app.set('key', 'val');

console.log(app.env('key'));
// val

console.log(process.env.key);
//val
```

#### app.env()

app.env() will get environmental variables available from the scope in which they are called

```js
/**
 *  app.env(key)
 *  @param {string} key
 **/

 app.set('key', 'val');

console.log(app.env('key'));
// val

```

#### app.uuid

app.config generates a random uuidv4

```js

console.log(app.uuid())
// 4370139d-653c-49eb-933e-a714eec14f69

```

#### app.bot()

app.bot() will return true if the user-agent detected is a bot

* `config.bot.items` should contain an array of bots to check for
* this feature could be used to perform targeted seo optimization
* refer to `headers.bot()`

```js

router.get('/', function(stream, headers, flags){

  let useragent = headers.ua();
  if(app.bot(useragent)){
    console.log('bot detected')
  }

})

```


#### app.fetch()
the app.fetch method will perform a secure http2 client request to any local or external address.

* app.fetch uses your apps ssl certificate/s to create a secue connection

app.fetch uses body parser to automatically parse responses for the following content-types:

* `application/json` ~ response.json | data as parsed json object/array
* `multipart/form-data` ~ response.text | data as string
* `application/x-www-form-urlencoded`  ~ response.text | data as string

all content-types are available as:

* `*` ~ response.text | data as string
* `*` ~ response.buffer | data as buffer


```js

/**
 *  app.fetch(obj, callback, timeout)
 *  @param {object} obj // cookie name
 *  @param {object} callback // function(err,response)
    @param {number} timeout // milliseconds ~ optionally overrides config.fetch.tomeout
 **/

/* simple json get example */

let head = {
  'url': 'https://example_get_url.com', //dest url
  ':method': 'GET', // fetch method
  ':path': '/example/path', // fetch path
  'Content-Type': 'application/json'
  // your other headers ...
}

let timeout = 5000 // optional

app.fetch(head, function(err,response){
  if(err){return console.error(err)}

  console.log(response.headers) // response headers object
  console.log(response.json) // response as json ~ if available
  console.log(response.buffer) // response as buffer
  console.log(response.text) // response as text
  console.log(response.statusText) // ok/not ok

},timeout)

/* simple post example */

let data = JSON.stringify({test: 'body'});

let head = {
  'url': 'https://example_post_url.com', //dest url
  ':method': 'POST', // fetch method
  ':path': '/example/path' // fetch path
  'body':  data// fetch body for accepted methods
  "Content-Type": "application/json"
  // ...
}

app.fetch(head, function(err,res){
  if(err){return console.error(err)}
  console.log(res.headers) // response headers object
  console.log(res.json) // response as json ~ if available
  console.log(res.buffer) // response as buffer
  console.log(res.text) // response as text
  console.log(res.statusText) // ok/not ok
})

```

#### app.etag()

refer to `stream` for a more detailed explanation.

app.etag can be used to manually create a hashed etag from data that you may use in a stream.

the following digests are supported:

insecure
* `md5`, `md5-sha1`, `ripemd160`, `rmd160`, `sha1`

secure
* `sha224`, `sha256`, `sha384`, `sha512`, `sha512-224`, `sha512-256`, `whirlpool`

excessive
* `sha3-224`, `sha3-256`, `sha3-384`,`sha3-512`, `blake2b512`, `blake2s256`, `shake128`,`shake256`


```js
/**
 *  app.etag(digest, data, encode)
 *  @param {string} digest // hash digest
 *  @param {string} data // data to be hashed
 *  @param {string} encode // base64/hex
 **/

router.get('/etagdemo', function(stream, headers, flags){

  // manual app.etag
  let etag = app.etag('sha3-512', 'test string', 'base64');
  stream.addHeader('Etag', etag)

});

```

#### app.digest()

app.digest can be used to manually create a digest from data for the Digest header.

the following prefixes are recommended:

* `sha-224`, `sha-256`, `sha-384`, `sha-512`

the following digests are supported recommended:

* `sha224`, `sha256`, `sha384`, `sha512`

those are the current recommended standards.
you can use any equivalents from the above mentioned in `app.etag` if you want to implement your own standard.

```js
/**
 *  app.digest(prefix, encode, data, digest)
 *  @param {string} prefix // valid http digest header prefix e.g. sha-256/sha-512
 *  @param {string} digest // valid nodejs digest hash digest
 *  @param {string} data // data to be hashed
 *  @param {string} encode // base64/hex
 **/

router.get('/digestdemo', function(stream, headers, flags){

  stream.addHeader('Digest', app.digest('sha-512', 'sha512', 'test digest', 'base64'));

});

```


#### app.cookie_encode()

refer to `stream` for a more detailed explanation.

app.cookie_encode can be used to manually create cookies

```js

/**
 *  app.cookie_encode(key, val, settings)
 *  @param {string} key // cookie name
 *  @param {string} val // cookie value
 *  @param {object} settings // cookie settings
 **/

router.get('/', function(stream, headers, flags){

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
  // add cookie to headers
  stream.addHeader('Set-Cookie', [new_cookie]);

  // send headers & send json response
  stream.json({msg: 'cookie created'});

})
```

#### app.cookie_sign()

refer to `cookie_parser` for a more detailed explanation.

app.cookie_sign can be used to manually create signed cookies

```js

/**
 *  app.cookie_sign(key, val, settings)
 *  @param {string} key // cookie name
 *  @param {string} val // cookie to sign value
 *  @param {object} settings // cookie settings
 **/

router.get('/', function(stream, headers, flags){

  // manual create cookie and add to outbouheaders
  let cookie_specs = {
    Domain: 'localhost',
    Path: '/',
    Expires: Date.now(),
    MaxAge: 9999,
    HttpOnly: true,
    SameSite: 'Lax',
    Secure: true,
    Priority: 'High'
  }
  let new_cookie = app.cookie_encode('name', 'value', cookie_specs),
  // manual create cookie sig and add to outbouheaders
  signed_cookie = app.cookie_sign('name', 'value', cookie_specs);
  // only required for manual add
  stream.addHeader('Set-Cookie',  [new_cookie, signed_cookie]);

  // send headers & send json response
  stream.json({msg: 'cookies created'});

})
```

#### app.cookie_decode()

refer to `stream` for a more detailed explanation.

app.cookie_decode can be used to create a deserialized cookies object

```js

/**
 *  app.cookie_decode(key, val, settings)
 *  @param {string} settings // cookie header
 **/


router.get('/', function(stream, headers, flags){

  // manual return cookies object
  console.log(app.cookie_decode(headers.get('cookie')))

});

```

#### app.cookie_verify()

app.cookie_verify can be used to verify signed cookies

* app.cookie_verify is for signed cookies only
* app.cookie_verify will return true if the cookie is valid

```js

/**
 *  app.cookie_verify(name, obj)
 *  @param {string} name // cookie name to verify
 *  @param {object} settings // cookies object
 **/

router.get('/', function(stream, headers, flags){
  // verify cookie with name=name
  console.log(
    app.cookie_verify('name', headers.get('cookie'))
  )
  // true/false

})
```

#### app.blacklist()

refer to blacklist

app.blacklist can be used add ip addresses to your blacklist

* this action controlled by `sync`
* this action will trigger an update of the blacklist cache for all worker threads
* no server restart is required.


```js

/**
 *  app.blicklist(ip)
 *  @param {string|array} ip // ip address/addresses to add to blacklist
 **/

router.get('/', function(stream, headers, flags){

  app.blacklist(stream.ip)

  // or add multiple in Array

  app.blacklist([stream.ip])

});

```

#### app.whitelist()

refer to whitelist

app.whitelist can be used add ip address to your whitelist

* this action controlled by `sync`
* this action will trigger an update of the whitelist cache for all worker threads
* no server restart is required.


```js

/**
 *  app.whitelist(ip)
 *  @param {string|array} ip // ip address or array of address to add to whitelist
 **/

router.get('/', function(stream, headers, flags){

  app.whitelist(stream.ip);

  //or multiple in array

  app.whitelist([stream.ip]);

});

```

#### app.gzip

refer to `compression` for a more detailed explanation.

gzip compression can be used anywhere via the app.gzip method:

```js
/**
 *  @app.gzip(data, method, options, callback)
 *
 *  @param {Buffer/TypedArray/DataView/ArrayBuffer/string} data
 *  @param {boolean} method ~ true = compress | false = decompress
 *  @param {object} options ~ optional | fallback to config.compression.gzip.settings
 *  @param {function} callback ~ function(err,res) | optional | no callback for sync
 **/

let str = 'test'
//gzipSync
str = app.gzip(str, true);

//gunzipSync
str = app.gzip(str, false);

console.log(str.toString())
// test

//gzip
app.gzip(str, true, function(err,res){

  //gunzip
  app.gzip(res, false, function(err,str){
    console.log(str.toString())
    // test
  })
})
```

#### app.brotli

refer to `compression` for a more detailed explanation.

brotli compression can be used anywhere via the app.brotli method:

```js

/**
 *  @app.brotli(data, method, options, callback)
 *
 *  @param {Buffer/TypedArray/DataView/ArrayBuffer/string} data
 *  @param {boolean} method ~ true = compress | false = decompress
 *  @param {object} options ~ optional | fallback to config.compression.brotli.settings
 *  @param {function} callback ~ function(err,res) | optional | no callback for sync
 **/

let str = 'test'
//brotliCompressSync
str = app.brotli(str, true);

//brotliDecompressSync
str = app.brotli(str, false);

console.log(str.toString())
// test

//brotliCompress
app.brotli(str, true, function(err,res){

  //brotliDecompress
  app.brotli(res, false, function(err,str){
    console.log(str.toString())
    // test
  })
})
```

#### app.deflate

refer to `compression` for a more detailed explanation.

deflate compression can be used anywhere via the app.deflate method:

```js

/**
 *  @app.deflate(data, method, options, callback)
 *
 *  @param {Buffer/TypedArray/DataView/ArrayBuffer/string} data
 *  @param {boolean} method ~ true = compress | false = decompress
 *  @param {object} options ~ optional | fallback to config.compression.deflate.settings
 *  @param {function} callback ~ function(err,res) | optional | no callback for sync
 **/

let str = 'test'
//deflateSync
str = app.deflate(str, true);

//inflateSync
str = app.deflate(str, false);

console.log(str.toString())
// test

//deflate
app.deflate(str, true, function(err,res){

  //inflate
  app.deflate(res, false, function(err,str){
    console.log(str.toString())
    // test
  })
})

```

#### app.engine.add()
refer to template engines

extra template engines can be added using `app.engine.add`:
* `sicarii/lib/adapters` will contain your new engine template.
* `config.template_engine` will automatically be updated with your settings


```js

/**
 *  app.engine.add(title, obj, callback)
 *  @param {string} title // template engine title in snake_case
 *  @param {object} obj // data new engine
 *  @param {function} callback function(err)
 **/

app.engine.add('test', {
  "enabled": false, // must have enabled
  "settings": {
    "use_globals": false,
    "globals":{}
  }
}, function(err){
  if(err){return console.error(err)}
})

```

#### app.engine.del()
refer to template engines

extra engines can be deleted using `app.engine.del`:
* `sicarii/lib/adapters` will have the adapter removed
* `config.template_engine` will automatically remove the engine/s
* this action should be called for production to minimize sicarii's size
* this action cannot be undone.


```js

/**
 *  app.engine.del(items, callback)
 *  @param {array} items // template engine items to remove
 *  @param {function} callback function(err)
 **/

app.engine.del(['pug','twig', 'nunjucks', 'ejs'], function(err){
  if(err){return console.error(err)}
})

```

#### app.qs()

app.qs will return a serialized query string from valid json object

```js

/**
 *  app.qs(items, sep, eq)
 *  @param {object} items // query string object
 *  @param {string} sep // query string separetor ~ defalts to &
 *  @param {string} eq // query string equals ~ defalts to =
 **/

 var data = {
   test: '%^&*$#hsdacsddf',
   test2: 2345
 }

 console.log(app.qs(data))
 // test=%25%5E%26*%24%23hsdacsddf&test2=2345

```

#### app.path()

app.path returns a json object containing the parsed path data

```js

/**
 *  app.path(path)
 *  @param {string} path // path string
 **/

 let somepath = app.path('sicarii/lib/utils.js');

 console.log(somepath)
 // {root: '',dir: 'sicarii/lib',base: 'utils.js',ext: '.js', name: 'utils'}

 console.log(somepath.base)
 // utils.js

```

#### app.url()

app.url returns a json object containing the parsed url data

```js

/**
 *  app.url(path)
 *  @param {string} path // path string
 **/

 let someurl = app.url('https://user:pass@sub.example.com:8080/p/a/t/h?query=string#hash');

 console.log(someurl)

 /*
   {
     protocol: 'https:',
     slashes: true,
     auth: 'user:pass',
     host: 'sub.example.com:8080',
     port: '8080',
     hostname: 'sub.example.com',
     hash: '#hash',
     search: '?query=string',
     query: { query: 'string' },
     pathname: '/p/a/t/h',
     path: '/p/a/t/h?query=string',
     href: 'https://user:pass@sub.example.com:8080/p/a/t/h?query=string#hash'
   }

 */

```

#### app.dns.get()

* perform dns lookup
* returns json object containing results

```js
/**
 *  app.dns.reverse(path, cnf, callback)
 *  @param {string} path // path string
 *  @param {object} cnf // optional nodejs dns.lookup.options
 *  @param {function} callback // function(err,res)
 **/

 app.dns.get('example.org', function(err, data){
   if(err){return console.log(err)}
   //{address: 'someaddress', family: 'somefamily'}
 });

```

#### app.dns.getService()

* perform dns lookupService
* returns json object containing results

```js
/**
 *  app.dns.getService(path,port,callback)
 *  @param {string} path // path string
 *  @param {number} port // port
 *  @param {function} callback // function(err,res)
 **/

 app.dns.getService('127.0.0.1', 80, function(err, data){
   if(err){return console.log(err)}
   console.log(data)
   //{ hostname: 'localhost', service: 'http' }
 });

```

#### app.dns.reverse()
* perform dns reverse
* returns json array containing results

```js
/**
 *  app.dns.reverse(path, callback)
 *  @param {string} path // path string
 *  @param {function} callback // function(err,res)
 **/

 app.dns.reverse('208.67.222.222',function(err, hostnames){
   if(err){return cb(err)}
   console.log(hostnames)
   // [ 'resolver1.opendns.com' ]
 })

```

#### app.encode()
* convert between data encoding

supported conversions
* buffer|utf8|hex|base64|Uint8Array|Uint16Array|Uint32Array|Int8Array|Int16Array|Int32Array

```js

/**
 *  app.encode(data, from, to)
 *  @param {string} data // path string
 *  @param {string} from // data current encoding
 *  @param {string} to // ~ optional data to be encoded to
 **/

let str = 'test string';

// basic encode to buffer
app.encode(str, 'utf8') // utf8 string to buffer

// convert between
str = app.encode(str, 'utf8', 'base64') // from utf8 string to base64

str = app.encode(str, 'base64', 'hex') // base64 string to hex

str = app.encode(str, 'hex', 'Uint8Array') // hex string to Uint8Array

// and so on ...

```

# Body parser
- [Back to index](#documentation)

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

# Etags
- [Back to index](#documentation)

sicarii has its own built in configurable in Etag generator.

it provides separate options for `render/document`  to `static` files and can also be manually overridden
or manually added on a per case basis.

* automatic `render/document` Etags can be configured at `config.render.etag`
* automatic `static` file Etags can be configured at `config.static.etag`
* automatic etags will use cache settings from `config.render.cache` or `config.static.cache` if available
* etags support either `base64` or `hex` encoding.


the following digests are supported:

insecure
* `md5`, `md5-sha1`, `ripemd160`, `rmd160`, `sha1`

secure
* `sha224`, `sha256`, `sha384`, `sha512`, `sha512-224`, `sha512-256`, `whirlpool`

excessive
* `sha3-224`, `sha3-256`, `sha3-384`,`sha3-512`, `blake2b512`, `blake2s256`, `shake128`,`shake256`

Etags can be manually added using either an `app.etag` or `stram.etag` function like so:

```js

/**
 *  stream.etag(digest, data, encode)
 *  @param {string} digest // hash digest
 *  @param {string} data // data to be hashed
 *  @param {string} encode // base64/hex
 **/

router.get('/etagdemo', function(stream, headers, flags){

  // manual app.etag
  stream.addHeader('Etag', app.etag('sha3-512', 'test string', 'base64'));

  // manual stream.etag ~ will automatically add to stream.headers
  stream.etag('sha3-512', 'test string', 'base64');

  stream.respond(stream.headers)

  stream.end('test etag')

});

```

As etags are hashed from the data being sent, they can also easily double as the Digest header:

```js
router.get('/etagdemo', function(stream, headers, flags){


  // manual stream ~ will automatically add to stream.headers
  stream.etag('sha3-512', 'test string', 'base64');

  // set Digest header using hash from Etag
  stream.addHeader('Digest', 'sha-256=' + stream.headers['Etag']);


  stream.respond(stream.headers)

  stream.end('test etag')

});

```

# Cookie parser
- [Back to index](#documentation)

sicarii has its own built in cookie parser.
* the cookie parser can be enabled/disabled at `config.cookie_parser.enabled`
* with `config.cookie_parser.auto_parse` enabled, inbound cookies will automatically be parsed to json.
* if the cookie parser is disabled, cookies can still be created/parsed through `app.cookie_encode()`/`app.cookie_decode()`.

#### encode cookie
sicarii has two methods for creating serialized cookies.

* this method has support for multiple cookies
* this method can create a separate signed cookie for tamper detection
* `config.cookie_parser.sig.secret` is used to hmac the cookie
* `config.cookie_parser.sig.suffix` is the signed cookies suffix
* a signed cookie will be will use digest/encode settings from `config.crypt.hmac`
* a signed cookie will be will use digest/encode settings from `config.crypt.hmac`

```js

/**
 *  stream.cookie(key, val, settings)
 *  app.cookie(key, val, settings)
 *  @param {string} key // cookie name
 *  @param {string} val // cookie value
 *  @param {object} settings // cookie settings
 **/

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
    Priority: 'High',
    Signed: true
  })


  // manual create cookie and add to outbouheaders
  let cookie_specs = {
    Domain: 'localhost',
    Path: '/',
    Expires: Date.now(),
    MaxAge: 9999,
    HttpOnly: true,
    SameSite: 'Lax',
    Secure: true,
    Priority: 'High'
  }
  let new_cookie = app.cookie_encode('name', 'value', cookie_specs),
  // manual create cookie sig and add to outbouheaders
  signed_cookie = app.cookie_sign('name', 'value', cookie_specs);
  // only required for manual add
  stream.addHeader('Set-Cookie',  [new_cookie, signed_cookie]);

  // send headers & send json response
  stream.json({msg: 'cookies created'});

})
```


#### decode cookie
sicarii has three methods for returning a deserialized cookies object
```js

/**
 *  app.cookie_decode(key, val, settings)
 *  @param {string} settings // cookie header
 **/


router.get('/', function(stream, headers, flags){

  // return cookies object
  console.log(headers.cookies())

   // return automatically parsed cookies object ~ config.cookie_parser.auto_parse
   console.log(stream.cookies)

  // manual return cookies object
  console.log(app.cookie_decode(headers.get('cookie')))

});

```


# Template engines
- [Back to index](#documentation)

sicarii has the ability to render, cache and compress templates engine templates.
refer to `stream.render` for further details

* template engines can be configured at `config.template_engine`
* templates are rendered with `stream.render`
* templates use settings from `config.render`
* templates are compresses if compression is enabled
* templates are cached if `config.render.cache` is enabled
* all sicarii template engine adapters are asynchronous.
* automatic error handling is provided for consistency across all engines
* each engines individual error messages are still provided in the callback


```js
/**
 *  stream.render(path, obj, callback)
 *  @param {string} path // file path relative to render dir
 *  @param {object} obj // data for rendered file
 *  @param {function} callback ~ optional
 **/

 //send headers and rendered doc
 stream.render('index.html', {title: 'basic'})

 //or

 // send headers and rendered doc
 stream.render('index.html', {title: 'basic'}, function(err){
   if(err){
     // the stream has ended and automatic error handling has been provided.
     return console.log(err)
   }

   // do something...
 })
```

sicarii currently supports the following engines:

#### default

* default engine, renders html files with javascript template literals included
* the default engine is ideal for single page apps or when you do not require extra features
* the default engine does not require any additional installation

 ```js

 router.get('/', function(stream, headers, flags){

   // send default headers and render index.html
   stream.render('index.html', {title: 'basic'})

 });

 ```

 index.html
 ```html
 <title>${title}</title>

 ```

#### poorboy

* renders html from javascript
* write your templates in plain javascript
* poorboy engine does not require any additional installation
* poorboy can be extended to use html parsing modules
* poorboy can be used to render pre-compiled templates from any other engine
* poorboy is fast

```js

router.get('/', function(stream, headers, flags){

  // send default headers and render index.js
  stream.render('index.js', {
    title: 'poorboy',
    people: ['bob', 'alice']
  })

});

```

basic example

```js
// /render/index.js

module.exports = (data) => `
<html>
  <head>
    <title>${data.title}</title>
  </head>
  <body></body>
</html>
`

```

advanced example

```js
// /render/index.js

const includes = require('./includes'); //cached
module.exports = (data) => `
<html>
  <head>
    ${includes.title(data.title)}
  </head>
  <body>
   ${includes.group(data.people)}
  </body>
</html>
`

```

```js
// /render/includes.js

const includes = module.exports = {
  title: (i) => '<title>'+ i +'</title>',
  li: (i) => '<li>'+ i +'</li>',
  group: (i) => {
    let ul = '<ul>';
    for (let x = 0; x < i.length; x++) {
      ul += includes.li(i[x])
    }
    ul += '</ul>';
    return ul;
  }
}

```

extended example

```js
// /render/index.js
const cheerio = require('cheerio'); // cached
const includes = require('./includes'); //cached

module.exports = (data) => {

  const $ = cheerio.load(includes.body(data.title))

  let test = $('<ul />').attr({id: 'test'})
  $(data.people).each(function(i){
    test.append(includes.li(data.people[i]))
  })

  $('body').append(
    $('<h1 />').text('Hello world'),
    test
  )

  return $.html()

}

```

```js
// /render/includes.js

const includes = module.exports = {
  body: (i) => '<html><head><title>'+ i +'</title></head><body></body></html>',
  li: (i) => '<li>'+ i +'</li>'
}

```

#### nunjucks

* usage of nunjucks requires nunjucks to be pre installed
* do not set nunjucks to cache templates as this will be done by sicarii
* `config.template_engine.nunjucks.filters` is a path to filters file relative to cwd
* `config.template_engine.nunjucks.globals.vars` are added to all renders
* refer to nunjucks documentation for further details

```js

router.get('/', function(stream, headers, flags){
  // send default headers and render index.njk
  stream.render('index.njk', {title: 'nunjucks'})
});

```

index.njk
```html
<title>{{title}}</title>

```

custom filters can be added like so:

```js
/*
"nunjucks": {
  "enabled": true,
  "filters": "/path/to/filters.js"
}
*/


// filters.js
module.exports = {
  shorten: function(str, count) {
    return str.slice(0, count || 1);
  }
}

```


#### liquidjs

* usage of liquidjs requires liquidjs to be pre installed
* do not set liquidjs to cache templates as this will be done by sicarii
* refer to liquidjs documentation for further details

```js

router.get('/', function(stream, headers, flags){

  // send default headers and render index.liquid
  stream.render('index.liquid', {title: 'liquidjs'})

});

```

index.liquid
```html
<title>{{title}}</title>

```

#### squirrelly

* usage of squirrelly requires nunjucks to be pre installed
* do not set squirrelly to cache templates as this will be done by sicarii
* refer to squirrelly documentation for further details

```js

router.get('/', function(stream, headers, flags){

  // send default headers and render index.html
  stream.render('index.html', {title: 'squirrelly'})

});

```

index.html
```html
<title>{{it.title}}</title>

```

#### twig

* usage of twig requires twig to be pre installed
* refer to twig documentation for further details

```js

router.get('/', function(stream, headers, flags){

  // send default headers and render index.twig
  stream.render('index.twig', {title: 'twig'})

});

```

index.twig
```html
<title>{{title}}</title>

```

#### ejs

 * usage of ejs requires ejs to be pre installed
 * do not set ejs to cache templates as this will be done by sicarii
 * refer to ejs documentation for further details

```js

router.get('/', function(stream, headers, flags){

 // send default headers and render index.ejs
 stream.render('index.ejs', {title: 'ejs'})

});

```

index.ejs
```html
<title><%= title %></title>

```

#### ect

 * usage of ect requires ect to be pre installed
 * do not set ect to cache templates as this will be done by sicarii
 * refer to ect documentation for further details

```js

router.get('/', function(stream, headers, flags){

 // send default headers and render index.ect
 stream.render('index.ect', {title: 'ect'})

});

```

index.ect
```html
<title><%= @title %></title>

```

#### eta

 * usage of eta requires eta to be pre installed
 * do not set eta to cache templates as this will be done by sicarii
 * refer to eta documentation for further details

```js

router.get('/', function(stream, headers, flags){

 // send default headers and render index.eta
 stream.render('index.eta', {title: 'eta'})

});

```

index.eta
```html
<title><%= it.title %></title>

```


#### pug

 * usage of pug requires pug to be pre installed
 * do not set pug to cache templates as this will be done by sicarii
 * refer to pug documentation for further details

 ```js

 router.get('/', function(stream, headers, flags){

    // send default headers and render index.pug
   stream.render('index.pug', {title: 'pug'})

 });

 ```

 index.pug
 ```pug
 html
      head
          title #{title}

 ```

#### mustache

* usage of mustache requires mustache to be pre installed
* this async adapter is specific to sicarii
* mustache has 0 dependencies

* refer to mustache documentation for further details

```js

router.get('/', function(stream, headers, flags){
   // send default headers and render index.html with included partial
  stream.status(200).render('index.html', {
    partials: { // include mustache partials in external docs here
      user: '/partial_user.html', // path to partial relative to render dir
      years: '/partial_age.html' // path to partial relative to render dir
    },
    title: 'test title', // template vars
    name: 'jack',
    age: '999'
  })

});

```

index.html
```html
<html>
  <head>
    <title>{{title}}</title>
  </head>
  <body>
    my name is {{#name}}{{> user}}{{/name}}<br>
    i am {{#age}}{{> years}}{{/age}} years old
  </body>
</html>

```

partial_user.html
```html
<strong>{{name}}</strong>
```

partial_age.html
```html
<strong>{{age}}</strong>
```

#### extend
sicarii template engines is easily extendable

* note ~ extra template engines are currently being added to sicarii
* template engines can be added or removed

#### add engine
extra engines can be added using `app.engine.add`:
* `sicarii/lib/adapters` will contain your new engine template.
* `config.template_engine` will automatically be updated with your settings


```js

/**
 *  app.engine.add(title, obj, callback)
 *  @param {string} title // template engine title in snake_case
 *  @param {object} obj // data new engine
 *  @param {function} callback function(err)
 **/

app.engine.add('test', {
  "enabled": false, // must have enabled
  "settings": {
    "use_globals": false,
    "globals":{}
  }
}, function(err){
  if(err){return console.error(err)}
})

```

extra engines can be manually added the following way:

* `sicarii/lib/adapters` contains templates that you can use as a base to adapt any template engine.
* clone one of the template files and rename it
* edit the cloned file to accept your template engine
* add the template engine to `config.template_engine.engines` using the same cloned files name
* duplicate `config.template_engine.default`, rename it, add your settings and enable it.
* the file name must be the same ass `config.template_engine[your_file_name]`
* the adapters you are not using can be deleted and removed from config for production

an example of how easy it is to add a template engine to sicarii:

```js

// /sicarii/lib/adapters/ejs.js

const ejs = require("ejs"),
config = require(process.env.config_file),
utils = require('../utils'),
settings = config.template_engine.ejs.settings;

module.exports = function(stream, file, src, url, data, cb){
  ejs.renderFile(file, data, settings, function(err, data){
    if(err){
      utils.err(stream, 'GET', url, 500, 'ejs template render error')
      if(cb){cb(err)}
      return;
    }
    utils.render_sort(stream, data, url, cb);
  });
}

```

you are simply passing your template engines data through
to `utils.render_sort` in an async way.


#### delete engine
extra engines can be deleted using `app.engine.del`:
* `sicarii/lib/adapters` will have the adapter removed
* `config.template_engine` will automatically remove the engine/s
* this action should be called for production to minimize sicarii's size
* this action cannot be undone.


```js

/**
 *  app.engine.del(items, callback)
 *  @param {array} items // template engine items to remove
 *  @param {function} callback function(err)
 **/

app.engine.del(['pug','twig', 'nunjucks', 'ejs'], function(err){
  if(err){return console.error(err)}
})

```

# Botnet
- [Back to index](#documentation)

sicarii has its own built in bot detect and block features

* block unwanted bots from accessing data.
* create targeted seo responses for search engines.

#### bot block

* bot blocking can be configured at `config.bot.block`
* bot user-agent sub-strings can be manually added to `config.bot.block.items`
* `config.bot.block.enabled` will enable blocking of all bot user-agent
  sub-string matches within `config.bot.block.items`

#### bot detect

* bot detection can be configured at `config.bot.detect`
* bot user-agent sub-strings can be manually added to `config.bot.detect.items`


```js

 router.get('/', function(stream, headers, flags){


   if(headers.bot()){
     // render template containing seo data only
     let useragent = headers.ua();

     if(useragent.includes('google')){
       stream.render('index_seo_google.html', {
         data: {
           some: 'google data',
           specifically: 'relating',
           to: 'google seo'
         }
       })
     } else if(useragent.includes('facebook')) {
       stream.render('index_seo_facebook.html', {
         data: {
           some: 'facebook data',
           specifically: 'relating',
           to: 'facebook seo'
         }
       })
     } else {
       stream.render('index_seo_default.html', {
         data: {
           some: 'default data',
           specifically: 'relating',
           to: 'default seo'
         }
       })
     }
   } else {
     // render normal template not polluted with seo
     stream.render('index.html', {title: 'basic'})
   }


 })

```

# Ip blacklist
- [Back to index](#documentation)

sicarii has its own built in ip blacklist

* the ip blacklist can be configured at `config.blacklist`
* the ip blacklist is controlled by `sync`
* ip addresses can be manually added to `./config/ip_config.json`
* dynamically adding a blacklist via `app.blacklist` will sync across all worker threads
* ip addresses that have been blacklisted will be denied access globally to all worker servers

```js

/**
 *  app.blicklist(ip)
 *  @param {string} ip // ip address to add to blacklist
 **/

router.get('/', function(stream, headers, flags){

  app.blacklist(stream.ip)

});

```

# Ip whitelist
- [Back to index](#documentation)

sicarii has its own built in ip whitelist for both master and worker servers

* the ip whitelist can be configured at `config.whitelist` for workers
* the ip whitelist can be configured at `config.cache.whitelist` for the master server
* ip addresses can be manually added to `./config/ip_config.json`
* ip addresses that have not been whitelisted will be denied access to the master/worker servers
* this feature should be enabled for production on the master server

```js

const { app } = require('sicarii');

app.whitelist('some.ip.address')


```

# Auth-token
- [Back to index](#documentation)

sicarii has its own built in header auth-token authentication for both master and worker servers

* the auth-token can be configured at `config.authtoken` for workers
* the auth-token can be configured at `config.cache.authtoken` for the master server
* streams that do not have the correct auth-token header will be denied access to the master/worker servers
* this feature should be enabled for production on the master server

# Cache
- [Back to index](#documentation)

sicarii has its own built in easily extendable and multi-thread compatible in-memory cache.

* the same cache is shared over all worker-threads to prevent cache duplication.
* the cache can act as a standalone app for remote usage.
* the cache supports auth-token and ip authentication for local or remote access.
* the cache can be hosted locally or remotely.
* the cache will store compressed streams if either of `gzip/brotli/deflate` are enabled.
* `render/document` cache can be configured at `config.render.cache`
* the `render/static` cache will store headers as well as the document.
* the `render/static` cache will automatically remove items dated past their maxage settings.
* `static` file cache can be configured at `config.render.static`.
* if `config.verbose` is enabled, the cache status of a render/doc/file... will be logged to console.
* the cache module MUST be initiated outside of the worker scope.
* not doing so would would pointlessly spawn multiple instances of the cache.
* one instance of cache shares data with all instances of workers.
* cache has its own `server` object that has been named the same as your apps `server` help to prevent spawning both on the same thread.
* the cache server can be configured at `config.cache`.
* the cache port can be set at `config.cache.port`
* `config.cache.server` accepts all nodejs http2 configuration


#### authentication

the cache server can be authenticated by way of auth-token and/or ip whitelist

* the ip whitelist `config.cache.whitelist` will limit access to the ip addresses in `config.cache.whitelist.ip`
* the ip authtoken `config.cache.authtoken` will require the specified token header and secret upon connection.


#### usage

below is `one` example of a `correct` way and an `incorrect` way to setup cache.
```js

const { app, cluster } = require('sicarii');

if(cluster.isMaster) {

  /* CORRECT! */
  const { sync, Cache, server } = require('sicarii/master');


  // cache extensions here

  // start cache server manually
  server.listen()

  // or

  // start cache server with sync
  sync.init().respawn().listen();


} else {

  const { server, router } = require('sicarii/main');

  /* INCORRECT! */
  const { server } = require('sicarii/master');


  //
  server.listen()
  server.listen(app.config.port)

}

```

#### cache object

the cache has the following collections which are `reserved` for sicarii internal usage.

```js

{
  "render": [], // render/document cache
  "static": [], // static cache
  "session": [], // session cache
  "store": []
}

```

#### cache internal methods

the cache has the following Methods which are `reserved` for sicarii internal usage.
you may use these but should not change them:

```js

/**
 *  @param {string} collection ~ cache collection
 *  @param {object} obj ~ request settings
 **/

// used to add an object within to a collection
Cache.add_cache(collection, obj);
// Cache.add_cache('store', {key: 'val'});

// used to find an object within a collection
Cache.get_cache(collection, obj);

//used to delete an object by index from a collection
Cache.del_cache_index(collection, obj)

//used to reset a collection
Cache.reset_cache(collection)

//used to import a collection
Cache.import_cache(collection, obj)

//used to export a collection to file
Cache.export_cache(collection, obj)

```

#### cache extend

* the cache server does not share the same nodejs method extensions as your app server.


the Cache and server objects can be easily extended to add your own methods like so:

```js

if(cluster.isMaster) {

  const { sync, Cache, server } = require('sicarii/master');

  /* add to the Cache object */

  //return a collection
  Cache.prototype.return_example = function(collection){
    return this[collection];
  }

  //add a new collection
  Cache.prototype.new_collection_example = function(collection, obj){
    this[collection] = obj.new_name;
    return this;
  }

  //add a new object to a collection
  Cache.prototype.new_entry_example = function(collection, obj){
    this[collection].push(obj)
    return this
  }


  /* add to or extend the caches server object */

  //add custom error handler to cache server.
  server.on('error', function(err){
    console.log(err)
  })

  //extend on listening to include extra data.
  server.on('listening', function(err,res){
    console.log('i am the caches server')
  })

  // all extensions should be added prior to starting server
  // server.listen / sync.listen will create the new Cache() object
  //server.listen()

  sync.init().respawn().listen(/* optional callback*/);

}


```

#### cache api
the cache can be accessed via either or both of the server/browser depending on your settings.

```js

/* api object */

let cache_obj = {
  method: 'val', //the cache method to use
  src: 'static', // the collection name
  data: {
    //the data object with settings/data specific to the method if any.
  }
}
```

#### cache http2 client request using app.fetch

```js
/* app.fetch example */


let head = {
  'url': app.config.cache.url, //dest url
  ':method': 'POST', // fetch method
  ':path': '/', // fetch path
  'Content-Type': 'application/json',
  'X-Auth-Token': 'secret',
  'body':  JSON.stringify(cache_obj)// fetch body for accepted methods
}

app.fetch(head, function(err,res){
  if(err){return console.error(err)}
  console.log(res.json)
})

```

#### cache http2 client request

```js

/* server example */

const http2 = require('http2');

let options = app.set_cert();

options = Object.assign(options, app.config.server);

client = http2.connect(app.config.cache.url, options),
head = {
  ':method': 'POST',
  ':path': '/',
  'Content-Type': 'application/json',
  'X-Auth-Token': 'secret'
},
stream = client.request(head),
body = '';

stream.setEncoding('utf8');

stream.on('response', function(headers){
  console.log(headers)
});

stream.on('data', function(chunk){
  body += chunk;
});

stream.on('end', function(data){
  // parse and log result
  console.log(JSON.parse(body));
});

// send api object
stream.end(JSON.stringify(cache_obj), 'utf8');

```

#### cache Browser fetch request

```js
/* browser example */

fetch('https://localhost:5000/',{
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'Sec-Fetch-mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
    'X-Auth-Token': 'secret'
  },
  body: JSON.stringify(cache_obj)
})
.then(function(res){
  res.json().then(function(data){
    console.log(data)
  })
})
.catch(function(err){
  console.log(err)
})
```

# Store
- [Back to index](#documentation)

sicarii has its own built in easily extendable and multi-thread compatible in-memory/flat-file json store.

* the same store is shared over all worker-threads.
* store is built into the Cache object
* store supports auth-token and ip authentication for local or remote access.
* store can be hosted locally or remotely.
* store is initiated with Cache.
* a current timestamp is added to every new store object automatically
* store is accessed via the `app` object
* store is available to the master and worker scopes
* store items must have a unique id


#### store api

* the store api is similar to the session api, with a few extra methods

```js

/**
 *  app.store(method, data, callback)
 *  @param {string} method ~ store data
 *  @param {object|array} data ~ store data compatible with method
 *  @param {function} callback ~ function(err,res)
 **/


let obj = {
  id: app.uuid(),
  user: 'test',
  token: 'secret',
  age 5
}

// add or update a store object with the same id
// a date timestamp is automatically added
// adds object to end of collection
app.store('add', obj, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// unshift or update a store object with the same id
// a date timestamp is automatically added
// adds object to beginning of collection
app.store('unshift', obj, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});


// find a store object
app.store('find', {user: 'test'}, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// find the index of a store object
// returns -1 for not found
app.store('findIndex', {user: 'test'}, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// replace or add additional values to a store object
app.store('assign', [{user: 'test'}, {age: 23, token: 'newtoken'}], function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// assign values to each included key of each object in store
app.store('each', {add: 'this', and: 'this', to: 'each'}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// delete keys from each object in store
app.store('omit', ['add', 'and', 'to'], function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// return chunked section of store
// app.store('chunk', ['chunk size', 'chunk count'])
app.store('chunk', [2,3], function(err,res){
  if(err){return console.error(err)}
  console.log(res.data.data)
});

// sort store by key and return count amount
// count is optional
app.store('sort', {key: 'id', count: 2}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// delete a store object
app.store('delete', {user: 'test'}, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// get the first x amount of store objects
app.store('first',  5, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// get the last x amount of store objects
app.store('last',  5, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// return filtered store objects by values greater than
app.store('gt', {age: 4}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// return filtered store objects by values less than
app.store('lt', {age: 4}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// return filtered store objects by values greater than or equal to
app.store('gte', {age: 4}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// return filtered store objects by values less than or equal to
app.store('lte', {age: 4}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// return store collection
app.store('val', function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

//add multiple objects at the same time
app.store('concat', [{id: 1}, {id: 2}, {id:3}], function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});


// save store to file at config.store.path
// file write is non blocking
app.store('write', function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// load store into cache from config.store.path
// this action should only be called once
app.store('read', function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

```

#### store extend

the store object can be easily extended via the Cache object to add your own methods like so:

```js

if(cluster.isMaster) {

  const { sync, Cache } = require('sicarii/master');


  // Cache.store_[YOUR METHOD NAME]

  // create function to reset store
  Cache.prototype.store_reset = function(src, obj){
    //src = 'store'
    //obj = data
    this[src] = [];
    return { success: true, msg: 'store reset' }
  }


  // start app
  sync.init().respawn().listen(/* optional callback*/);

  // reset sessions
  app.store('reset', function(err,res){
    if(err){return console.error(err)}
    console.log(res)
    // { success: true, msg: 'store reset' }
  })

}
```

# Sessions
- [Back to index](#documentation)

sicarii has its own built in easily extendable and multi-thread compatible in-memory session store.

* the same sessions are shared over all worker-threads.
* sessions is built into the Cache object
* sessions supports auth-token and ip authentication for local or remote access.
* sessions can be hosted locally or remotely.
* sessions is initiated with Cache.
* a current timestamp is added to every new session object automatically
* sessions are accessed via the `app` object
* sessions are available to the master and worker scopes
* session items must have an unique id


#### session api

* the session api is similar to the store api, with a few exclusions

```js

/**
 *  app.session(method, data, callback)
 *  @param {string} method ~ session data
 *  @param {object} data ~ session data
 *  @param {function} callback ~ function(err,res)
 **/


let obj = {
  id: app.uuid(),
  user: 'test',
  token: 'secret',
  age 5
}

// add or update a session object with the same id
// a date timestamp is automatically added
// adds object to end of collection
app.session('add', obj, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// unshift or update a session object with the same id
// a date timestamp is automatically added
// adds object to beginning of collection
app.session('unshift', obj, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});


// find a session object or automatically delete expired session
app.session('find', {user: 'test'}, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// find the index of a session object
// returns -1 for not found
app.session('findIndex', {user: 'test'}, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// replace or add additional values to a session object
app.session('assign', [{user: 'test'}, {age: 23, token: 'newtoken'}], function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// assign values to each included key of each object in sessions
app.session('each', {add: 'this', and: 'this', to: 'each'}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// delete keys from each object in sessions
app.session('omit', ['add', 'and', 'to'], function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// return chunked section of session
// app.session('chunk', ['chunk size', 'chunk count'])
app.session('chunk', [2,3], function(err,res){
  if(err){return console.error(err)}
  console.log(res.data.data)
});

// sort session by key and return count amount
// count is optional
app.session('sort', {key: 'id', count: 2}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// delete a session object
app.session('delete', {user: 'test'}, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// get the first x amount of sessions
app.session('first',  5, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// get the last x amount of sessions
app.session('last',  5, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// return filterd sessions by values greater than
app.session('gt', {age: 4}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// return filterd sessions by values less than
app.session('lt', {age: 4}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// return filtered sessions by values greater than or equal to
app.session('gte', {age: 4}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// return filterd sessions by values less than or equal to
app.session('lte', {age: 4}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// return session collection
app.session('val', function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// remove all expired sessions
app.session('check', function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

```


#### session extend

sessions can be easily extended via the Cache object to add your own methods like so:

```js

if(cluster.isMaster) {

  const { sync, Cache } = require('sicarii/master');


  // Cache.store_[YOUR METHOD NAME]

  // create function to reset sessions
  Cache.prototype.store_reset = function(collection, obj){
    this[collection] = [];
    return { success: true, msg: 'sessions reset' }
  }


  // start app
  sync.init().respawn().listen(/* optional callback*/);

  // reset sessions
  app.session('reset', function(err,res){
    if(err){return console.error(err)}
    console.log(res)
    // { success: true, msg: 'sessions reset' }
  })

}
```

# Compression
- [Back to index](#documentation)

sicarii has built in support for gzip, brotli and deflate compression.

* automatic compression can be enabled/disabled individually for your render/static/upload/download/cache data.
* the static file server stream pre-compressed files if `config.compression[*].prezipped` is enabled
* uncompressed originals are not required to be stored if using `config.compression[*].prezipped`

#### gzip

* `config.compression.gzip.enable` will enable/disable gzip compression
* `config.compression.gzip.settings` will enable you to configure gzip compression
* `config.compression.gzip.settings` accepts all nodejs gzip settings
* `config.compression.gzip.prezipped` will enable you to load/serve already compressed files
* with `config.compression.gzip.prezipped` enabled, you do not have to store an uncompressed copy of the data
* `config.compression.gzip.ext` will set the default gzip file extension

gzip compression can also be used anywhere via the app.gzip method:

```js
/**
 *  @app.gzip(data, method, options, callback)
 *
 *  @param {Buffer/TypedArray/DataView/ArrayBuffer/string} data
 *  @param {boolean} method ~ true = compress | false = decompress
 *  @param {object} options ~ optional | fallback to config.compression.gzip.settings
 *  @param {function} callback ~ function(err,res) | optional | no callback for sync
 **/

let str = 'test'
//gzipSync
str = app.gzip(str, true);

//gunzipSync
str = app.gzip(str, false);

console.log(str.toString())
// test

//gzip
app.gzip(str, true, function(err,res){

  //gunzip
  app.gzip(res, false, function(err,str){
    console.log(str.toString())
    // test
  })
})
```

#### brotli

* `config.compression.brotli.enable` will enable/disable brotli compression
* `config.compression.brotli.settings` will enable you to configure brotli compression
* `config.compression.brotli.settings` accepts all nodejs brotli settings
* `config.compression.brotli.prezipped` will enable you to load/serve already compressed files
* with `config.compression.brotli.prezipped` enabled, you do not have to store an uncompressed copy of the data
* `config.compression.brotli.ext` will set the default brotli file extension

brotli compression can also be used anywhere via the app.brotli method:

```js

/**
 *  @app.brotli(data, method, options, callback)
 *
 *  @param {Buffer/TypedArray/DataView/ArrayBuffer/string} data
 *  @param {boolean} method ~ true = compress | false = decompress
 *  @param {object} options ~ optional | fallback to config.compression.brotli.settings
 *  @param {function} callback ~ function(err,res) | optional | no callback for sync
 **/

let str = 'test'
//brotliCompressSync
str = app.brotli(str, true);

//brotliDecompressSync
str = app.brotli(str, false);

console.log(str.toString())
// test

//brotliCompress
app.brotli(str, true, function(err,res){

  //brotliDecompress
  app.brotli(res, false, function(err,str){
    console.log(str.toString())
    // test
  })
})
```

#### deflate

* `config.compression.deflate.enable` will enable/disable deflate compression
* `config.compression.deflate.settings` will enable you to configure deflate compression
* `config.compression.deflate.settings` accepts all nodejs deflate settings
* `config.compression.deflate.prezipped` will enable you to load/serve already compressed files
* with `config.compression.deflate.prezipped` enabled, you do not have to store an uncompressed copy of the data
* `config.compression.deflate.ext` will set the default deflate file extension

deflate compression can also be used anywhere via the app.deflate method:

```js

/**
 *  @app.deflate(data, method, options, callback)
 *
 *  @param {Buffer/TypedArray/DataView/ArrayBuffer/string} data
 *  @param {boolean} method ~ true = compress | false = decompress
 *  @param {object} options ~ optional | fallback to config.compression.deflate.settings
 *  @param {function} callback ~ function(err,res) | optional | no callback for sync
 **/

let str = 'test'
//deflateSync
str = app.deflate(str, true);

//inflateSync
str = app.deflate(str, false);

console.log(str.toString())
// test

//deflate
app.deflate(str, true, function(err,res){

  //inflate
  app.deflate(res, false, function(err,str){
    console.log(str.toString())
    // test
  })
})

```

# Static file server
- [Back to index](#documentation)

sicarii has its own built in static file server

* the static file server can be configured at `config.static`
* the static file server stream pre-compressed files if `config.compression[*].prezipped` is enabled
* uncompressed originals are not required to be stored if using `config.compression[*].prezipped`
* the static file server will use and cache compressed files if compression is enabled
* `config.static.path` is the static file dir relative to cwd()
* `config.static.blocked` an array of paths to forbid static file server only access
* `config.static.etag` static file server etag options
* `config.static.headers` default headers to use for all static files
* `config.static.cache` enable static file cache
* `config.static.cache` enable static file cache


* the static file server will only serve content-types included at `config.mimetypes`


# MIME types
- [Back to index](#documentation)

sicarii uses a strict MIME type policy

sicarii will only allow access to content-types listed at `config.mimetypes`
sicarii will only allow uploads to content-types listed at `config.uploads.mimetypes`

* these lists should ONLY include content-types that you use
* shorter lists will increase the speed and security of your app


# Logs
- [Back to index](#documentation)

sicarii has its own built in extendable logging system

* `config.logs.path` is the logs file dir relative to cwd()
* `config.logs.separator` is the separator used to separate log entries
* `config.logs.error` will enable logging logger errors to console
* `config.logs.compression` the compression type to use for backup of full log files

* all log files have a max size. when reached, the log file is backed up then reset
* all logging is asynchronous and controlled by `sync`
* all logs use fs.appendFile for speed

logging is optionally provided for the following:

#### ip logger
will log all ip addresses to file

* `config.logs.ip.base_name` the base name for the log file
* `config.logs.ip.max_size` the max size for log file before it is backed up and reset
* `config.logs.ip.ext` the filename extension
* `config.logs.ip.log_time` adds additional timestamp to log
* `config.logs.ip.log_path` adds additional path to log
* the ip logger will not log static file streams
* the ip logger will not log streams resulting in an error

ip logger can also be used via server.log_ip() in the worker threads:

```js

router.get('/login', function(stream, headers, flags){

  server.log_ip(stream.ip, '/login')

});

```

#### error logger
will log all errors to file

* `config.logs.error.base_name` the base name for the log file
* `config.logs.error.max_size` the max size for log file before it is backed up and reset
* `config.logs.error.ext` the filename extension

error logger can also be used via server.log_error() in the worker threads:

```js

router.get('/someerror', function(stream, headers, flags){

  let his_log = [Date.now(), 'GET', '/someerror', '400', 'some message'].join('::::')
  server.log_error(his_log)

});

```

#### history logger
will log all visits to file

* `config.logs.history.base_name` the base name for the log file
* `config.logs.history.max_size` the max size for log file before it is backed up and reset
* `config.logs.history.ext` the filename extension
* the history logger will not log static file streams
* the history logger will not log streams resulting in an error

history logger can also be used via server.log_history() in the worker threads:

```js

router.get('/login', function(stream, headers, flags){

  let his_log = [Date.now(), 'GET', '/login'].join('::::')
  server.log_history(his_log)

});

```

#### logs.backup()
logs can be backed up manually via logs.backup()

* this action will compress, backup and reset a log file that exceeds its configured max_size setting

```js
/**
 *  logs.backup(method, callback)
 *  @param {string} method // log method to backup ip|history|error
 *  @param {object} callback // function(err)
 **/

if(cluster.isMaster) {

  const { sync, logs } = require('sicarii/master');

  sync.init().respawn().listen();

  logs.backup('ip', function(err){
    if(err){return console.log(err)}
  })

}
```

#### logs.cron()
logs can be backed up automatically via logs.cron()

* this action will call logs.backup for each log file.
* `config.logs.cron` will set the cron interval.
* this action will compress, backup and reset a log file that exceeds its configured `max_size` setting

```js

if(cluster.isMaster) {

  const { sync, logs } = require('sicarii/master');

  sync.init().respawn().listen();

  logs.cron()

}

```


# Crypt
- [Back to index](#documentation)

sicarii has its own built in crypto utilities

* crypt is part of the worker scope

```js
 const { crypt } = require('sicarii/main');
```

#### crypt.rnd()

create random bytes

```js
/**
 *  @crypt.rnd(data, secret, callback)
 *
 *  @param {number} len ~ length
 *  @param {string} encode ~ optional | hex/base64 | empty returns buffer
 **/

 const { server, router, crypt } = require('sicarii/main');


 let randombytes = crypt.rnd(64, 'hex');

 console.log(randombytes);


```

#### crypt.hmac

crypt.hmac can be used to sign or validate data using a hmac

* `config.crypt.hmac` contains a list of default options which must be valid to nodejs


#### crypt.hmac.sign()

```js

/**
 *  @crypt.hmac.sign(data, secret)
 *
 *  @param {string} data ~ hmac data
 *  @param {string} secret ~ hmac secret | optional | fallback to config.crypt.hmac.secret
 **/

 const { server, router, crypt } = require('sicarii/main');

 let sig = crypt.hmac.sign('data', 'secret');

 console.log(sig)


```

#### crypt.hmac.verify()

```js

/**
 *  @crypt.hmac.verify(data, sig, secret)
 *
 *  @param {string} data ~ hmac data
 *  @param {string} sig  ~ hmac sig to compare
 *  @param {string} secret ~ hmac secret | optional | fallback to config.crypt.hmac.secret
 **/

 const { server, router, crypt } = require('sicarii/main');

 let sig = crypt.hmac.sign('data', 'secret');

 console.log(
   crypt.hmac.verify('data', sig, 'secret')
 )
 // true


```


#### crypt.pbkdf2()

crypt.pbkdf2 provides a sync/async Password-Based Key Derivation Function 2 implementation

* `config.crypt.pbkdf2` contains a list of default options which must be valid to nodejs

```js

/**
 *  @crypt.pbkdf2(secret, salt, len, callback)
 *
 *  @param {string|Buffer|TypedArray|DataView} secret ~ data to use in kdf
 *  @param {string|Buffer|TypedArray|DataView} salt  ~ salt to use in kdf
 *  @param {number} len ~ output length
 *  @param {function} callback ~ optional | no callback for Sync | function(err,res)
 **/

 const { server, router, crypt } = require('sicarii/main');

 // sync
 let res = crypt.pbkdf2('data', 'secret', 32);

 console.log(
   res
 )

 // async
 crypt.pbkdf2('data', 'secret', 32, function(err,res){
   console.log(res)
 });

```

#### crypt.scrypt()

crypt.scrypt provides a sync/async Password-Based Key Derivation Function implementation

* `config.crypt.scrypt` contains a list of default options which must be valid to nodejs

```js

/**
 *  @crypt.scrypt(secret, salt, len, callback)
 *
 *  @param {string|Buffer|TypedArray|DataView} secret ~ data to use in kdf
 *  @param {string|Buffer|TypedArray|DataView} salt  ~ salt to use in kdf
 *  @param {number} len ~ output length
 *  @param {function} callback ~ optional | no callback for Sync | function(err,res)
 **/

 const { server, router, crypt } = require('sicarii/main');

 // sync
 let res = crypt.scrypt('data', 'secret', 32);

 console.log(
   res
 )

 // async
 crypt.scrypt('data', 'secret', 32, function(err,res){
   console.log(res)
 });

```

#### crypt.jwt

crypt.jwt can be used to generate or verify json web tokens

* `config.crypt.jwt` contains a list of default options which must be valid to nodejs
* `config.crypt.jwt.encode` use hex/base64 encoding for jwt
* `config.crypt.jwt.secret` is the secret used to hmac your jwt data
* `config.crypt.jwt.digest` valid nodejs digest to use
* `config.crypt.jwt.header` jwt header includes
* `config.crypt.jwt.claims` jwt public claims
* you can add extra default plublic claims to `config.crypt.jwt.claims`
* `config.crypt.jwt.claims.exp` is a `mandatory` time till expires in milliseconds
* `config.crypt.jwt.claims.nbf` is a `optional` time before valid in milliseconds

* `config.crypt.jwt.claims.exp` is mandatory, all other  added are optional

* `config.crypt.jwt.claims.iat` is automatically generated

#### crypt.jwt.sign()

```js

/**
 *  @crypt.jwt.sign(data, callback)
 *
 *  @param {object} data ~ extra claims to be added to jwt
 *  @param {function} callback ~ optional | function(err,res)
 **/

 const { server, router, crypt } = require('sicarii/main');


 // optional private claims ~ empty object for no extra claims {}
 let jwt_private = {
   name: 'some name',
   age: 999
 }

 // sync
 let sig = crypt.jwt.sign(jwt_private)

 console.log(sig)
 // returns valid jwt || null for error


 // async
 crypt.jwt.sign(jwt_private, function(err,sig){
   if(err){console.log(err)}
   console.log(sig)
 })

```


#### crypt.jwt.verify()

```js

/**
 *  @crypt.jwt.verify(sig, callback)
 *
 *  @param {string} sig ~ jwt data to be verified
 *  @param {function} callback ~ optional | function(err,res)
 **/

 const { server, router, crypt } = require('sicarii/main');

 // optional private claims ~ empty object for no extra claims {}
 let jwt_private = {
   name: 'some name',
   age: 999
 },
 sig = crypt.jwt.sign(jwt_private); // test jwt

 //sync
 console.log(crypt.jwt.verify(sig))
 // returns null for error || false for invalid, expired or nbf || jwt obj for pass

 //async
 crypt.jwt.verify(sig, function(err,is_valid){
   if(err){return console.error(err)}
   if(is_valid){
     console.log(is_valid);
    //jwt obj for pass
  } else {
    //invalid jwt
  }
 })

```

#### encryption (symmetric)

* encrypt/decrypt settings can be configured at `config.encryption`
* `config.encryption.modes` includes `gcm|cbc|ccm|ctr|cfb|cfb1|cfb8|ocb|ofb`
* `config.encryption.cipher` includes `aes|aria|camellia`
* `config.encryption.bit_len` includes `128|192|256`
* `config.encryption.iv_len` is the accepted iv length for your options
* `config.encryption.tag_len` is the accepted auth-tag length for your mode | if needed
* `config.encryption.encode` encoding of your secret and encrypted data

* be aware that most of the different modes require you to alter other options.

#### crypt.keygen()

create an encryption key to be used for symmetric encryption and decryption

* `config.encryption.secret_len` the correct key length for your encryption
* `config.encryption.iterations` pbkdf2 iterations for creating secure key
* `config.encryption.digest` hash digest used for creating secure key
* `config.encryption.settings.encode` encoding for key/encryption

* a generated key can be manually added to `config.encryption.secret` for access via `app.config`

```js

 const { server, router, crypt } = require('sicarii/main');


 let secret = crypt.keygen();

 console.log(secret);


```

#### crypt.encrypt()

encrypt data

```js

/**
 *  @crypt.encrypt(data, secret, callback)
 *
 *  @param {string|buffer} data ~ data to be encrypted
 *  @param {string} secret ~ correctly encoded encryption key
 *  @param {function} callback ~ optional | function(err,res)
 **/

 const { server, router, crypt } = require('sicarii/main');

 let data = 'test', // data to be encrypted
 secret = crypt.keygen(); // generate new secure encryption key

 // sync
 let ctext = crypt.encrypt(data,secret);
 console.log(ctext)
 // encrypted data || undefined if error

 //async
 crypt.encrypt(data, secret, function(err,res){
   if(err){return console.error(err)}
   console.log(ctext)
   // encrypted data
 });
```


#### crypt.decrypt()

decrypt encrypted data

```js

/**
 *  @crypt.decrypt(data, secret, callback)
 *
 *  @param {string|buffer} data ~ data to be decrypted
 *  @param {string} secret ~ correctly encoded encryption key
 *  @param {function} callback ~ optional | function(err,res)
 **/

 const { server, router, crypt } = require('sicarii/main');

 let data = 'test',
 secret = crypt.keygen(),
 ctext = crypt.encrypt(data,secret); // encrypted data


 //sync
let ptext = crypt.decrypt(ctext, secret);
console.log(ptext)
// test || undefined for error

 //async
 crypt.decrypt(ctext, secret, function(err,ptext){
   if(err){return console.error(err)}
   console.log(ptext)
   // test || undefined for error
 });
```

#### encryption (asymmetric)

* `config.rsa.length` the rsa modulusLength 2048|4096|8192|16384
* `config.rsa.publicExponent` default 65537
* `config.rsa.oaepHash` hash digest used for rsa-oaep encryption
* `config.rsa.encode` encoding for key/encryption hex|base64
* `config.rsa.publicKey` accepts all valid nodejs rsa publicKey settings
* `config.rsa.privateKey` accepts all valid nodejs rsa privateKey settings

#### crypt.rsa.create

create an encryption key pair to be used for asymmetric rsa-oaep encryption and decryption

```js

/**
 *  @crypt.rsa.create(callback)
 *  @param {function} callback ~ generated keys | function(err,res)
 **/

 const { crypt } = require('sicarii/main');

 // generate keypair for rsa-oaep
 crypt.rsa.create(function(err,keys){
   if(err){return console.log(err)}

   console.log(keys.publicKey)
   console.log(keys.rivateKey)
 })


```

#### crypt.rsa.encrypt

encrypt data using rsa-oaep encryption

```js

/**
 *  @crypt.rsa.encrypt(publicKey,ptext,callback)
 *  @param {string} publicKey ~ publicKey used to encrypt data
 *  @param {string|buffer} ptext ~ plain text/buffer | data to be encrypted
 *  @param {function} callback ~ cipher text | function(err,res)
 **/

 const { crypt } = require('sicarii/main');

 // generate keypair for rsa-oaep
 crypt.rsa.create(function(err,keys){
   if(err){return console.log(err)}

   crypt.rsa.encrypt(keys.publicKey, 'test data', function(err,ctext){
     if(err){return console.log(err)}
     console.log(ctext) // encrypted cipher text

   })
 })


```

#### crypt.rsa.decrypt

decrypt data using rsa-oaep encryption

```js
/**
 *  @crypt.rsa.decrypt(privateKey,ctext,callback)
 *  @param {string} privateKey ~ privateKey used to decrypt data
 *  @param {string} ctext ~ encoded data to be decrypted
 *  @param {function} callback ~ plain text | function(err,res)
 **/

 const { crypt } = require('sicarii/main');

 // generate keypair for rsa-oaep
 crypt.rsa.create(function(err,keys){
   if(err){return console.log(err)}

   crypt.rsa.encrypt(keys.publicKey, 'test data', function(err,ctext){
     if(err){return console.log(err)}
     console.log(ctext)

     crypt.rsa.decrypt(keys.privateKey, ctext, function(err,ptext){
       if(err){return console.log(err)}
       console.log(ptext) // 'test data'
     })

   })
 })


```


#### crypt.ecdsa

* `config.crypt.ecdsa` contains the ecdsa defaults
* `config.crypt.ecdsa.curve` is the ecdsa curve used
* `config.crypt.ecdsa.encode` is the encoding used for input and output
* `config.crypt.ecdsa.hash` is the hash used to sign data
* `config.crypt.ecdsa.publicKey` accepts all nodejs ecdsa publicKey options
* `config.crypt.ecdsa.privateKey` accepts all nodejs ecdsa privateKey options

#### crypt.ecdsa.create()

create elliptic curve keypair

```js
/**
 *  @crypt.ecdsa.create(callback)
 *
 *  @param {function} callback ~ function(err,keypair)
 **/

 const { server, router, crypt } = require('sicarii/main');

 // generate ec keypair async
 crypt.ecdsa.create(function(err, keypair){
   if(err){return console.error(err)}

   // do something with keypair
   console.log(keypair)

 })

```

#### crypt.ecdsa.sign()

create elliptic curve signature

```js
/**
 *  @crypt.ecdsa.sign(privateKey, data, callback)
 *
 *  @param {string} privateKey ~ encoded private key
 *  @param {string} data ~ data to sign with private key
 *  @param {function} callback ~ function(err,sig) || optional
 **/

 const { server, router, crypt } = require('sicarii/main');


 // generate ecdsa keypair async
 crypt.ecdsa.create(function(err, keypair){
   if(err){return console.error(err)}

   // sign some data async
   crypt.ecdsa.sign(keypair.privateKey, 'data', function(err,sig){
     if(err){return console.error(err)}
     // signed data
     console.log(sig);

    })
 })


```

#### crypt.ecdsa.verify()

verify data integrity

```js
/**
 *  @crypt.ecdsa.verify(publicKey, sig, data, callback)
 *
 *  @param {string} privateKey ~ encoded private key
 *  @param {string} sig ~ data signature
 *  @param {string} data ~ data to verify with public key
 *  @param {function} callback ~ function(err,isValid) || optional
 **/
 const { server, router, crypt } = require('sicarii/main');

 let data = 'test data'
 // generate ec keypair async
 crypt.ecdsa.create(function(err, keypair){
   if(err){return console.error(err)}

   // sign some data
   crypt.ecdsa.sign(keypair.privateKey, data, function(err,sig){
     if(err){return console.error(err)}

     // verify some data against sig
     crypt.ecdsa.verify(res.publicKey, sig, data, function(err, isValid){
       if(err){return console.error(err)}
       console.log(isValid);
       // true/false
     })

    })
 })


```

#### crypt.ecdh

Elliptic Curve Diffie-Hellman (ECDH) key exchange

* `config.crypt.ecdh` contains the ecdh defaults
* `config.crypt.ecdh.curve` is the ecdh curve used
* `config.crypt.ecdh.encode` is the encoding used for input and output


#### crypt.ecdh.create()

create ecdh keypair

```js
/**
 *  @crypt.ecdh.create(callback)
 *
 *  @param {function} callback ~ function(err,keypair) | optional
 **/

 const { server, router, crypt } = require('sicarii/main');

 // generate ecdh keypair async
 crypt.ecdh.create(function(err, keypair){
   if(err){return console.error(err)}

   // do something with keypair
   console.log(keypair)

 })

 // generate ecdh keypair sync
 console.log(crypt.ecdh.create())

```

#### crypt.ecdh.compute()

compute ecdh secret

```js
/**
 *  @crypt.ecdh.compute(privateKey, publicKey, callback)
 *  @param {string} privateKey ~ encoded privateKey
 *  @param {string} publicKey  ~ encoded publicKey
 *  @param {function} callback ~ function(err,secret) | optional
 **/

 const { server, router, crypt } = require('sicarii/main');

 // generate ecdh keypair async
 crypt.ecdh.create(function(err,alice){
   if(err){return console.log(err)}
   console.log(alice)

   crypt.ecdh.create(function(err,bob){
     if(err){return console.log(err)}

     // compute secret sync
     let alice_secret = crypt.ecdh.compute(alice.privateKey, bob.publicKey),
     bob_secret = crypt.ecdh.compute(bob.privateKey, alice.publicKey);

     // verify secrets
     console.log(alice_secret === bob_secret)


     // compute secret async
     crypt.ecdh.compute(alice.privateKey, bob.publicKey, function(err,secret){
       if(err){return console.error(err)}
       console.log(secret)
     })

   })
 })

```

#### crypt.otp

one time pad (OTP)

* `config.crypt.otp` contains the otp defaults
* `config.crypt.otp.iterations` is the iteration count for generating a secure pad
* `config.crypt.otp.digest` is the digest used for generating a secure pad
* `config.crypt.otp.rounds` is the encrypt/decrypt rounds count
* `config.crypt.otp.encode` is the encoding used for input of decryption,
  output of encryption and the pad.
* the pad created must be at least the length of the text to be encrypted

#### crypt.otp.pad()

generate pad ofor OTP encryption

```js
/**
 *  @crypt.otp.pad(len, callback)
 *  @param {number} len ~ OTP pad length
 *  @param {function} callback ~ function(err,pad)
 **/

 const { server, router, crypt } = require('sicarii/main');

 let data = 'test'

 // generate pad to be used
 crypt.otp.pad(data.length, function(err,pad){
   if(err){return console.log(err)}
   console.log(pad) // returns encoded pad

 })

```

#### crypt.otp.encrypt()

encrypt data using generated pad

```js
/**
 *  @crypt.otp.encrypt(data, key, callback)
 *  @param {string|buffer} data ~ OTP data to be encrypted
 *  @param {string} key ~ encoded OTP pad
 *  @param {function} callback ~ function(err,cdata)
 **/

 const { server, router, crypt } = require('sicarii/main');

 let data = 'test'

 crypt.otp.pad(data.length, function(err,pad){
   if(err){return console.log(err)}

   // encrypt data with generated pad
   crypt.otp.encrypt(data, pad, function(err, cdata){
     if(err){return console.error(err)};
     console.log(cdata) // returns encoded and encrypted data

   })

 })

```

#### crypt.otp.decrypt()

decrypt data using generated pad and ciphertext

```js
/**
 *  @crypt.otp.decrypt(data, key, callback)
 *  @param {string|buffer} data ~ OTP encoded and encrypted data
 *  @param {string} key ~ encoded OTP pad
 *  @param {function} callback ~ function(err,data)
 **/

 const { server, router, crypt } = require('sicarii/main');

 let data = 'test'

 crypt.otp.pad(data.length, function(err,pad){
   if(err){return console.log(err)}

   crypt.otp.encrypt(data, pad, function(err, cdata){
     if(err){return console.error(err)};

     // decrypt data with generated pad and encoded ciphertext
     crypt.otp.decrypt(cdata, pad, function(err, pdata){
       if(err){return console.error(err)};
       console.log(pdata) // returns decrypted data as buffer
       console.log(pdata.toString() === data) // true
     })

   })

 })

```

# Backwards compatibility

http2 is supported as far back as the now `obsolete` internet explorer 11 so most people should not
need to worry about Backwards compatibility.
sicarii does however support Backwards compatibility, should you have any need for requiring it.

* `config.server.allowHTTP1` will enable/disable Backwards compatibility.
* the server `stream` event is reserved for http2, but the server `request` event is not and will not
  ever be required by sicarii.
* the server `stream` event will always ignore all non http2 requests.
* the `request` event will enable you to accept http1 requests using the nodejs http compatibility layer.  
* sicarii `stream` methods are not supported when using the http2 compatibility layer.
* the `request` event is limited to methods in the nodejs http compatibility api but can be manually
  extended to mimic most of the `stream` events.  

```js


const { app, cluster } = require('sicarii');

if(cluster.isMaster) {
  const { sync } = require('sicarii/master');
  //access to server object and cache prototype

  sync.init().respawn().listen();

} else {

  const { server, router, crypt } = require('sicarii/main');

  server.on('request', function (req, res) {
    if(req.httpVersion !== '2.0'){ // version check is mandatory
      // do something
      console.log('i am a http1 connection!')

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(app.js({test: 'ok'});

    }
  })

  router.get('/', function(stream, headers, flags){

    console.log('i am a http2 connection!')
    stream.status(200).render('index.html', {
      title: 'http2 connection'
    })

  });



  server.pre_cache().push_handler(true).listen(app.config.port);

}

```



[cd-img]: https://app.codacy.com/project/badge/Grade/d0ce4b5a5c874755bb65af1e2d6dfa87
[npm-img]: https://badgen.net/npm/v/sicarii?style=flat-square
[dep-img]:https://badgen.net/david/dep/angeal185/sicarii?style=flat-square
[sz-img]:https://badgen.net/packagephobia/publish/sicarii?style=flat-square
[lic-img]: https://badgen.net/github/license/angeal185/sicarii?style=flat-square
[npm-url]: https://npmjs.org/package/sicarii
