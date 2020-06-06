# sicarii
the zero dependency nodejs framework


```js

const { server, router } = require('sicarii');


// build new project
server.build()

//api methods

// get request
router.get('/test', function(req, res){
  let query = req.query;

  res.json({test: 'ok'})
});

// connect request
router.connect('/test', function(req, res){
  let query = req.query;

});

// options request
router.options('/test', function(req, res){
  let query = req.query;

});

// head request
router.head('/test', function(req, res){
  let query = req.query;

});

// trace request
router.trace('/test', function(req, res){
  let query = req.query;

  res.json({test: 'ok'})
});

// post request
router.post('/', function(req, res){
  let body = req.body;

  cl(body)

});

// delete request
router.delete('/', function(req, res){
  let body = req.body;

  cl(body)

});

// patch request
router.patch('/', function(req, res){
  let body = req.body;

  cl(body)
});

// put request
router.put('/', function(req, res){
  let body = req.body;

  cl(body)
});


// cookies

router.get('/', function(req, res){

  res.cookie('name', 'value',{
    Domain: 'localhost',
    Path: '/',
    Expires: Date.now(),
    MaxAge: 9999,
    HttpOnly: true,
    SameSite: 'Strict',
    Secure: true,
    Priority: 'High'
  })

  res.doc('/index.html', 'text/html; charset=utf-8');

});



// render static document
router.get('/', function(req, res){

  res.doc('index.html', 'text/html; charset=utf-8');

});


// render with optional template engine installed
router.get('/', function(req, res){

  res.render('index.njk', {title: 'nunjucks'})

  res.render('index.pug', {title: 'pug'})

});



//start server
server.listen(8080);



// tbc
```
