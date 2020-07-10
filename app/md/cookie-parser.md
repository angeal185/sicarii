# Cookie parser

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