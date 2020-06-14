const zlib = require('zlib'),
config = require(process.cwd() + '/config/config');

function gzip(data, method, settings, cb){
  if(!settings){
    settings = config.compression.gzip.settings;
    cb = false;
    console.log(config.compression.gzip.settings)
  }
  if(!cb && typeof settings === 'object'){
    if(method){
      return zlib.gzipSync(data, settings);
    } else {
      return zlib.gunzipSync(data, settings);
    }
  } else {
    if(method){
      return zlib.gzip(data, settings, cb);
    } else {
      return zlib.gunzip(data, settings, cb);
    }
  }
}

function deflate(data, method, settings, cb){
  if(!settings){
    settings = config.compression.deflate.settings;
  }
  if(!cb && typeof settings === 'object'){
    if(method){
      return zlib.deflateSync(data, settings);
    } else {
      return zlib.inflateSync(data, settings);
    }
  } else {
    if(method){
      return zlib.deflate(data, settings, cb);
    } else {
      return zlib.inflate(data, settings, cb);
    }
  }
}

function brotli(data, method, settings, cb){
  if(!settings){
    settings = config.compression.brotli.settings;
  }
  if(!cb && typeof settings === 'object'){
    if(method){
      return zlib.brotliCompressSync(data, settings);
    } else {
      return zlib.brotliDecompressSync(data, settings);
    }
  } else {
    if(method){
      return zlib.brotliCompress(data, settings, cb);
    } else {
      return zlib.brotliDecompress(data, settings, cb);
    }
  }
}


module.exports = { gzip, deflate, brotli }
