# Push handler

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