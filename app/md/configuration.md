# Configuration

sicarii has a tiny but powerful list of configurations

the configuration file at `./config/config.json` is an essential part of sicarii.
you MUST tweak it to your own requirements in order to maximize performance and security.

```js
//defaults

{
  "port": 8080, // server port
  "origin": "https://localhost", // server origin
  "verbose": true, // show log to console
  "dev": true, // log errors to console
  "proxy": false, //  x-forwarded-for as ip address
  "ip_config": "/config/ip_config", // path to ip_config.json
  "pre_cache": "/config/pre_cache", // path to pre_cache.json
  "push_handler": { // automatic push handler
    "enabled": true,
    "accept": ["text/html"], // accept header document types to accept
    "path": "/config/push" // path to push config file
  },
  "cluster": {
    "workers": 2 // worker count
    "settings": { //worker settings
      "serialization": "json"
    }
  },
  "sync": {
    "respawn": true // auto-respawn dead workers
  },
  "session": {
    "path": "/store/session/db.json", //read/write dir relative to cwd
    "maxage": 1000000, //maxage of sessions in ms
    "secret": "" //optional session secret
  },
  "cache": {
    "url":"https://localhost:5000", // cache server url
    "timeout": 5000, //cache response timeout ms
    "proxy": false, // x-forwarded-for as ip address
    "authtoken": { //cache auth-token header
      "enabled": false,
      "header": "X-Authtoken",
      "token": "12345"
    },
    "whitelist": { //cache server ip whitelist
      "enabled": true,
      "ip": ["::ffff:127.0.0.1"] //cache whitelisted ip addersses
    },
    "server": {
      //cache server config ~ accepts all nodejs http2 server settings
      "rejectUnauthorized": false
    },
    "headers": {
      //cache server outbound headers
    }
  },
  "cookie_parser": {
    "enabled": true, //enable cookie parser
    "auto_parse": true, //enable auto cookie parse
    "sig": {
      "hmac": "secret", // cookie sign hmac
      "prefix": "sig" // cookie sig prefix
    }
  },
  "stream": {
    "path_limit": 100, // stream path size limit ~ false to disable check
    "case_sensitive": true, // converts url pathnames to  lowercase if false
    "param_limit": 1000, // stream url search size limit ~ false to disable check
    "body_limit": 5000, // stream body size limit ~ false to disable check
    "methods": [ // add all allowed http  methods ~ remove if unused
      "get",
      "post",
      "connect",
      "put",
      "delete",
      "head"
    ],
    "querystring": true, // enable stream.qs
    "method_body": ["post", "delete", "patch", "put"], // methods return body
    "method_query": ["get","connect", "head", "options", "trace"],// methods return query params
    "content_types": [ // accepted body content-types ~ remove if unused
      "application/json",
      "text/plain",
      "multipart/form-data",
      "application/x-www-form-urlencoded"
    ]
  },
  "blacklist": { //enable server ip blacklist
    "enabled": false,
    "msg": "your ip has been blacklisted, have a nice day" // unauth msg
  },
  "whitelist": { //enable server ip whitelist
    "enabled": false,
    "msg": "Unauthorized" // unauth msg
  },
  "authtoken": {  //enable auth token header
    "enabled": false,
    "header": "X-Authtoken",
    "token": "xxxxxx",
    "msg": "server offline" // unauth msg
  },
  "server": {
    // accepts all http2 nodejs server options
  },
  "ssl": {
    "cert": "/cert/localhost.cert", // key/cert/pfx/ca as string path to file
    "key": "/cert/localhost.key"
  },
  "store": { // sicarri store
    "path": "/store/store/db.json" // read/write path relative to cwd
  },
  "uploads": {
    "enabled": true,
    "path": "/uploads", // uploads dir, relative to cwd()
    "recursive": true, //enable recursive folder creation
    "gzip": true, // compress file using gzip
    "brotli": false, // compress file using brotli
    "deflate": false, // compress file using deflate
    "mimetypes": {
      // accepted mimetypes
    },
    "max_filename": 30, // max filename length
    "max_filesize": 50000 // max upload content length
  },
  "static": {
    "path": "/static", // default static file path
    "blocked": [],
    "etag": { // etag header
      "enabled": true, // use etags on rendered files
      "digest": "sha3-256", //etag digest hash ~ crypto.getHashes();
      "encode": "base64" //etag digest encoding hex/base64
    },
    "cache": { // static file server cache
      "enabled": true, // enable cache on static file server
      "maxage": 1000000 // cached items maxAge
    },
    "headers": {} // default headers for static file server
  },
  "render": { // render/tempate engine defaults
    "path": "/render",
    "blocked": [],
    "etag": { // etag header
      "enabled": true, // use etags on rendered files
      "digest": "sha3-256", //etag digest hash ~ crypto.getHashes();
      "encode": "base64" //etag digest encoding hex/base64
    },
    "cache": { // rendered files cache
      "enabled": true, // enable cache on rendered files
      "maxage": 1000000 // cached items maxAge
    },
    "headers": { // default headers for rendered files
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
      "Server": "Nodejs",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "X-DNS-Prefetch-Control": "on",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "X-Content-Type-Options": "nosniff",
      "X-XSS-Protection": "1",
      "TK": "N"
    }
  },
  "compression": {
    "gzip": { // gzip compression
      "enabled": true,
      "prezipped": false, // use pre-compressed files
      "ext": ".gz", // compressed file extention
      "setting": {} // accepts all nodejs gzip compression settings
    },
    "brotli": { // brotli compression
      "enabled": false,
      "prezipped": false, // use pre-compressed files
      "ext": ".br", // compressed file extention
      "setting": {} // accepts all nodejs brotli compression settings
    },
    "deflate": { // deflate compression
      "enabled": false,
      "prezipped": false, // use pre-compressed files
      "ext": ".dfl", // compressed file extention
      "setting": {} // accepts all nodejs deflate compression settings
    }
  },
  "cors": { // default stream.cors fallback
    "origin": '',        // string  | Access-Control-Allow-Origin
    "methods": '',       // string  | Access-Control-Allow-Methods
    "allow_headers": '', // string  | Access-Control-Allow-Headers
    "expose_headers": '',// string  | Access-Control-Expose-Headers
    "credentials": true, // boolean | Access-Control-Allow-Credentials
    "maxage": 9999       // number  | Access-Control-Max-Age
  },
  "csp": { // content security policy object
    "default": "default-src 'self'"
  },
  "feature_policy": { // feature policy object
    "default": "microphone 'none'; geolocation 'none'"
  },
  "logs": {
    "path": "/logs", //path to log dir
    "separator": "|", // log separator
    "logs":["error", "history","ip"],
    "cron": 86400000, // logs cronjob interval
    "console_error": false, //log to console log-related errors
    "compression": "gzip", // backup compression ~ gzip/deflate/brotli
    "encodeURIComponent": false, // encode log entries
    "error": {
      "enabled": true, // enable auto error logs
      "max_size": 5000, // log max file size
      "base_name": "error", //log file base name
      "ext": ".txt" //log file base extension
    },
    "history": {
      "enabled": true, // enable auto history logs
      "max_size": 5000, // log max file size
      "base_name": "history", //log file base name
      "ext": ".txt" //log file base extension
    },
    "ip": {
      "enabled": true, // enable ip logging
      "max_size": 5000, // log max file size
      "base_name": "ip", //log file base name
      "ext": ".txt" //log file base extension
      "log_time": true, // add timestamp to log
      "log_path": true // add path to log
    }
  },
  "template_engine": { // template engine config
    "engines": [
      "basic", "poorboy", "nunjucks", "ejs", "pug",
      "mustache", "twig", "squirrelly", "ect", "eta",
      "liquidjs"
    ],
    "basic": {
      "enabled": true,
      "settings": {
        "pretty": false,
        "filters": {},
        "cache": false
      }
    },
    "squirrelly": {
      "enabled": false,
      "settings": {}
    },
    "eta": {
      "enabled": false,
      "settings": {}
    },
    "liquidjs": {
      "enabled": false,
      "settings": {
        "extname": ".liquid"
      }
    },
    "ect": {
      "enabled": false,
      "settings": {
        "cache": false,
        "open": "<%",
        "close": "%>"
      }
    },
    "poorboy": {
      "enabled": false,
      "settings": {
        "use_globals": false,
        "globals": {}
      }
    },
    "nunjucks": {
      "enabled": false,
      "jinjacompat": true,
      "filters": "",
      "globals": {
        "enabled": false,
        "vars": {}
      },
      "settings": {
        "autoescape": true,
        "noCache": true,
        "throwOnUndefined": false,
        "trimBlocks": false,
        "lstripBlocks": false,
        "tags": {}
      }
    },
    "ejs": {
      "enabled": false,
      "settings": {}
    },
    "pug": {
      "enabled": false,
      "settings": {
        "pretty": false,
        "filters": {},
        "cache": false
      }
    },
    "mustache": {
      "enabled": false,
      "tags": ["{{", "}}"],
      "settings": {}
    },
    "twig": {
      "enabled": false,
      "settings": {}
    }
  },
  "mimetypes": {
    // a list of all your allowed mimetypes
  },
  "crypt": {
    "jwt":{
      "secret": "secret", // jwt secret for hmac
      "digest": "sha256", // jwt digest for hmac
      "encode": "base64", // jwt encoding
      "separator": ":", // jwt token separator
      "header": { // jwt header
        "typ": "JWT",
        "alg": "HS256"
      },
      "claims": {
        "iss": "token issuer", // optional jwt issuer
        "sub": "token subject", // optional jwt subject
        "aud": "token audience", // optional jwt audience
        "exp": 5000000, // mandatory ms till expires
        "nbf": 0 // optional ms till valid
      }
    },
    "hmac": {
      "secret": "secret",  // hmac secret
      "digest": "sha3-512", // hmac hash function
      "encode": "hex" // output encode
    },
    "pbkdf2": {
      "digest": "sha3-512", // hash function
      "encode": "hex", // output encode
      "iterations": 50000 // kdf iterations
    },
    "scrypt": {
      "encode": "hex", // output encode
      "cost": 16384, // scrypt cost
      "blockSize":8, // scrypt cost
      "parallelization": 1 // scrypt parallelization
    },
    "encryption": {
      "secret": "", // encrypt/decrypt ~ app secret
      "secret_len": 32, // correct key length
      "iterations": 60000, // iterations to be used in keygen
      "digest": "sha3-512", // digest to be used in keygen
      "settings": { // THESE SETTINGS MUST BE VALID
        "cipher": "aes", // encrypt/decrypt cipher
        "bit_len": "256", // encrypt/decrypt bit
        "iv_len": 32, // encrypt/decrypt iv length
        "tag_len": 16, // encrypt/decrypt auth-tag length
        "encode": "hex", // encrypt/decrypt/keygen encoding
        "mode": "gcm" // encrypt/decrypt mode
      }
    },
    "ecdsa": {
      "curve": "secp521r1", // ecdsa curve
      "encode": "hex", // ecdsa encoding
      "hash": "sha3-512", // ecdsa hash used
      "privateKey": {  // accepts all nodejs ec privateKey settings
        "type": "sec1",
        "format": "der"
      },
      "publicKey": { // accepts all nodejs ec publicKey settings
        "type": "spki",
        "format": "der"
      }
    },
    "ecdh": { // ecdh key exchange
      "curve": "secp521r1",  // ecdh curve
      "encode": "hex"  // ecdh encoding
    },
    "rsa": { // rsa encryption
      "length": 4096, // rsa modulusLength
      "publicExponent": 65537,
      "encode": "hex",
      "oaepHash": "sha512", // rsa oeap hash used
      "publicKey": { // accepts all nodejs rsa publicKey settings
        "type": "pkcs1",
        "format": "pem"
      },
      "privateKey": { // accepts all nodejs rsa privateKey settings
        "type": "pkcs8",
        "format": "pem"
      }
    },
    "otp": { // contains the one time pad defaults
      "rounds": 1, // otp encrypt/decrypt rounds count
      "iterations": 10000, // iteration count for generating a secure pad
      "digest": "sha512", // digest used for generating a secure pad
      "encode": "hex" // encoding used for otp
    }
  },
  "bot": {
    "detect": {
      "items": ["Googlebot"] // manual detect bots via user-agent sub-string
    },
    "block": {  // automatically block bots via user-agent sub-string
      "enabled": false,
      "msg": "Unauthorized", // bot block msg
      "items": [] // blocked bots array
    }
  }
}

```