# App

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
    // render template containing seo data only

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
* convert between data types

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