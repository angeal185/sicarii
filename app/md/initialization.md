# Initialization

As sicarii is built for http2, SSL certificates are required.
The default path for the ssl certificates is as follows:

* `./cert/localhost.cert`
* `./cert/localhost.key`

These options be edited in the default `./config/config.json` file at `config.ssl`.
* for using the `key/cert/pfx/ca` options, a path to the file should be provided as the arg.
* `config.server` accepts all of the same default arguments as nodejs http2 server config.
* sicarii will automatically combine `config.ssl` with `config.server`

self signed certificates can be used for development and created as follows:

ECDSA

```bash

$ openssl ecparam -name secp384r1 -genkey -out localhost.key
$ openssl req -new -x509 -key localhost.key -out localhost.cert -days 365

```

RSA

```bash

$ openssl req -x509 -new -x509 -sha256 -newkey rsa:4096 -nodes -keyout localhost.key -days 365 -out localhost.cert

```