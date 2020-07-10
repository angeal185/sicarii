# Compression

sicarii has built in support for gzip, brotli and deflate compression.

* automatic compression can be enabled/disabled individually for your render/static/upload/download/cache data.

#### gzip

* `config.compression.gzip.enable` will enable/disable gzip compression
* `config.compression.gzip.settings` will enable you to configure gzip compression
* `config.compression.gzip.settings` accepts all nodejs gzip settings
* `config.compression.gzip.prezipped` will enable you to load/serve already compressed files
* with `config.compression.gzip.prezipped` enabled, you do not have to store an uncompressed copy of the data
* `config.compression.gzip.ext` will set the default gzip file extension

gzip compression can also be used anywhere via the app.gzip method:

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

#### brotli

* `config.compression.brotli.enable` will enable/disable brotli compression
* `config.compression.brotli.settings` will enable you to configure brotli compression
* `config.compression.brotli.settings` accepts all nodejs brotli settings
* `config.compression.brotli.prezipped` will enable you to load/serve already compressed files
* with `config.compression.brotli.prezipped` enabled, you do not have to store an uncompressed copy of the data
* `config.compression.brotli.ext` will set the default brotli file extension

brotli compression can also be used anywhere via the app.brotli method:

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

#### deflate

* `config.compression.deflate.enable` will enable/disable deflate compression
* `config.compression.deflate.settings` will enable you to configure deflate compression
* `config.compression.deflate.settings` accepts all nodejs deflate settings
* `config.compression.deflate.prezipped` will enable you to load/serve already compressed files
* with `config.compression.deflate.prezipped` enabled, you do not have to store an uncompressed copy of the data
* `config.compression.deflate.ext` will set the default deflate file extension

deflate compression can also be used anywhere via the app.deflate method:

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