# sicarii
the zero dependency http2 nodejs framework


```js

const { server, router } = require('sicarii');




// build new project
server.build()

//api methods

// get stream
router.get('/test', function(stream, headers){
  let query = stream.query; //json object

  stream.headers['Content-Type'] = 'application/json';

  stream.respond(stream.headers);

  stream.json({test: 'ok'});
  //stream.end('some text')
});

// connect stream
router.connect('/test', function(stream, headers){
  let query = stream.query;


});

// options stream
router.options('/test', function(stream, headers){
  let query = stream.query;

});

// head stream
router.head('/test', function(stream, headers){
  let query = stream.query;

});

// trace stream
router.trace('/test', function(stream, headers){
  let query = stream.query;

});



// post stream
router.post('/', function(stream, headers){
  let body = stream.body; // stream.buffer / stream.json

  console.log(body)

});

// delete stream
router.delete('/', function(stream, headers){
  let body = stream.body; // stream.buffer / stream.json

  console.log(body)

});

// patch stream
router.patch('/', function(stream, headers){
  let body = stream.body; // stream.buffer / stream.json

  console.log(body)
});

// put stream
router.put('/', function(stream, headers){
  let body = stream.body; // stream.buffer / stream.json

  console.log(body)
});


// cookies

router.get('/', function(stream, headers){

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


  stream.doc('/index.html', 'text/html; charset=utf-8');

});



// render static document
router.get('/', function(stream, headers){

  stream.doc('index.html', 'text/html; charset=utf-8');

});


// render with optional template engine installed
router.get('/', function(stream, headers){

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
