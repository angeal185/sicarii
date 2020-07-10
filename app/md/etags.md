# Etags

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

/**
 *  stream.etag(digest, data, encode)
 *  @param {string} digest // hash digest
 *  @param {string} data // data to be hashed
 *  @param {string} encode // base64/hex
 **/

router.get('/etagdemo', function(stream, headers, flags){

  // manual app.etag
  stream.addHeader('Etag', app.etag('sha3-512', 'test string', 'base64'));

  // manual stream.etag ~ will automatically add to stream.headers
  stream.etag('sha3-512', 'test string', 'base64');

  stream.respond(stream.headers)

  stream.end('test etag')

});

```

As etags are hashed from the data being sent, they can also easily double as the Digest header:

```js
router.get('/etagdemo', function(stream, headers, flags){


  // manual stream ~ will automatically add to stream.headers
  stream.etag('sha3-512', 'test string', 'base64');

  // set Digest header using hash from Etag
  stream.addHeader('Digest', 'sha-256=' + stream.headers['Etag']);


  stream.respond(stream.headers)

  stream.end('test etag')

});

```