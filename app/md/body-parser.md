# Body parser

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