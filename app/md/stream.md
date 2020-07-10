# Stream

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
    .status(300)
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
    .status(300)
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