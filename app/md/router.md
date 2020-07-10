# Router

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