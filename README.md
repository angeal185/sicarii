# sicarii
The zero dependency http2 nodejs multithreading framework

![cd-img] ![dep-img] ![syn-img] ![sz-img]

[![NPM Version][npm-img]][npm-url] ![lic-img]

## Installation

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

## About
documentation tbc

## Initialization

As sicarii is built for http2, SSL certificates are required.
The default path for the ssl certificates is as follows:

* `./cert/localhost.cert`
* `./cert/localhost.key`

These options be edited in the default `./config/config.json` file at `config.ssl`.
* for using the `key/cert/pfx/ca` options, a path to the file should be provided as the arg.

`config.server` accepts all of the same default arguments as nodejs http2 config.

sicarii will automatically combine `config.ssl` with `config.server`

#### build

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

this action is sandboxed for security reasons. should you wish to, you can delete the associated build files:

* `/sicarii/build.js`
* `/sicarii/lib/utils/init.js`

```js

const { app } = require('sicarii');

app.del_build()

```

#### server

Sicarii is built to incorporate  multi-threading by default. you can edit your thread count at `config.cluster.workers`

Although many frameworks wrap the server object within their app, limiting your server actions to those they
wish you to have access to, sicarii does not.
sicarii extends the existing nodejs modules in place, leaving you full access to the nodejs server object.
Most of these extensions can be either disabled, replaced, configured or extended.

Below is a 30 second simple `rest-api`/`static server` example.

```js
const { app, cluster } = require('sicarii');

if (cluster.isMaster) {

  const { Cache, server } = require('sicarii/cache');
  //start cache server and serve to multiple app server threads
  server.listen(app.config.cache.port)


  for (let i = 0; i < app.config.cluster.workers; i++) {
    // create worker threads
    cluster.fork();
  }

  // auto-restart dead workerd  
  cluster.on('exit', function(worker, code, signal) {
    cluster.fork();
  });


} else {

  const { server, router } = require('sicarii/main');

  // serve static
  router.get('/', function(stream, headers, flags){
    stream.headers['x-Static'] = 'ok';
    stream.doc('index.html', 'text/html; charset=utf-8');
  });

  // json rest
  router.post('/', function(stream, headers, flags){
    let body = stream.body.json;

    stream.headers['X-Rest'] = 'ok';

    // send headers & response
    stream.json({key: 'val'});
  });

  //start worker servers
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

  // send headers & response
  stream.json({test: 'get'});
  //stream.end('some text')
});

// connect stream
router.connect('/test', function(stream, headers, flags){
  let query = stream.query;
  console.log(query)
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

the configuration file at `./config/config.json` is an essential part of sicarii.
you should tweak it to your own requirements in order to maximize performance and security.

```js
//defaults

{
  "port": "8080", // server port
  "origin": "https://localhost", // server origin
  "verbose": true, // show log to console
  "proxy": false, //  x-forwarded-for as ip address
  "cluster": {
    "workers": 2 // worker count
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
    "querystring": true, // enable stream.qs
    "method_body": ["post", "delete", "patch", "put"], // methods return body
    "method_query": ["get","connect", "head", "options", "trace"],// methods return query params
    "content_types": [ // accepted body content-types
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
  "store": { // sicarri mem-cache
    "cache": {
      "enabled": false,
      "maxage": 10000
    }
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

  router.get('/', function(stream, headers, flags){

    // basic ~ default: uses template literals in html documents
    stream.render('index.html', {title: 'basic'})

    // nunjucks ~ requires manual installation of nunjucks
    stream.render('index.njk', {title: 'nunjucks'})

    // pug ~ requires manual installation of pug
    stream.render('index.pug', {title: 'pug'})

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
router.get('/downloadpath', function(stream, headers){
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
router.post('/upload', function(stream, headers){
    let ctype = headers['content-type'];

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

  router.get('/', function(stream, headers){

    stream.json({send: 'json'})

  });

  ```


  #### stream.redirect(dest)

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

  #### stream.headers

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

    stream.respond(stream.headers);
    stream.end()

  })
  ```

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

router.get('/etagdemo', function(stream, headers, flags){

  // manual app.etag
  stream.headers['Etag'] = app.etag('base64', 'test string', 'sha3-512');

  // manual stream.etag ~ will automatically add to stream.headers
  stream.etag('base64', 'test string', 'sha3-512');

  stream.respond(stream.headers)

  stream.end('test etag')

});

```

As etags are hashed from the data being sent, they can also easily double as the Digest header:

```js
router.get('/etagdemo', function(stream, headers, flags){


  // manual stream ~ will automatically add to stream.headers
  stream.etag('base64', 'test string', 'sha256');

  // set Digest header using hash from Etag
  stream.headers['Digest'] = 'sha-256=' + stream.headers['Etag'];


  stream.respond(stream.headers)

  stream.end('test etag')

});

```

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

  // send headers & send json response
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
  const { Cache, server } = require('sicarii/cache');

  // start cache server
  server.listen(app.config.cache.port)

  for (let i = 0; i < app.config.cluster.workers; i++) {
    cluster.fork();
  }

} else {

  const { server, router } = require('sicarii/main');

  /* INCORRECT! */
  const { Cache, server } = require('sicarii/cache');


  //
  server.listen(app.config.cache.port)
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

  const { Cache, server } = require('sicarii/cache');

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
  // server.listen will create the new Cache() object
  server.listen(app.config.cache.port)

}

```

#### cache api
the cache can be accessed via either or both of the server/browser depending on your settings.

```js

/* api object */

let cache_obj = {
  method: 'export_cache', //the cache method to use
  src: 'static', // the collection name
  data: { //the data object with settings/data specific to the method.
    path: '/temp'
  }
}
```

#### cache http2 client request

```js
/* server example */

const http2 = require('http2');

let options = app.set_cert();

options = Object.assign(options, app.config.cache.server);

client = http2.connect(app.config.cache.server, options),
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


documentation tbc
## sessions
documentation tbc
## compression

sicarii has built in support for gzip, brotli and deflate compression.

* automatic compression can be enabled/disabled individually for your render/static/upload/download/cache data.

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
