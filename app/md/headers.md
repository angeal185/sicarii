# Headers

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