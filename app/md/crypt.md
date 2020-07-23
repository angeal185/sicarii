# Crypt

sicarii has its own built in crypto utilities

* crypt is part of the worker scope

```js
 const { crypt } = require('sicarii/main');
```

#### crypt.rnd()

create random bytes

```js
/**
 *  @crypt.rnd(data, secret, callback)
 *
 *  @param {number} len ~ length
 *  @param {string} encode ~ optional | hex/base64 | empty returns buffer
 **/

 const { server, router, crypt } = require('sicarii/main');


 let randombytes = crypt.rnd(64, 'hex');

 console.log(randombytes);


```

#### crypt.hmac

crypt.hmac can be used to sign or validate data using a hmac

* `config.crypt.hmac` contains a list of default options which must be valid to nodejs


#### crypt.hmac.sign()

```js

/**
 *  @crypt.hmac.sign(data, secret)
 *
 *  @param {string} data ~ hmac data
 *  @param {string} secret ~ hmac secret | optional | fallback to config.crypt.hmac.secret
 **/

 const { server, router, crypt } = require('sicarii/main');

 let sig = crypt.hmac.sign('data', 'secret');

 console.log(sig)


```

#### crypt.hmac.verify()

```js

/**
 *  @crypt.hmac.verify(data, sig, secret)
 *
 *  @param {string} data ~ hmac data
 *  @param {string} sig  ~ hmac sig to compare
 *  @param {string} secret ~ hmac secret | optional | fallback to config.crypt.hmac.secret
 **/

 const { server, router, crypt } = require('sicarii/main');

 let sig = crypt.hmac.sign('data', 'secret');

 console.log(
   crypt.hmac.verify('data', sig, 'secret')
 )
 // true


```


#### crypt.pbkdf2()

crypt.pbkdf2 provides a sync/async Password-Based Key Derivation Function 2 implementation

* `config.crypt.pbkdf2` contains a list of default options which must be valid to nodejs

```js

/**
 *  @crypt.pbkdf2(secret, salt, len, callback)
 *
 *  @param {string|Buffer|TypedArray|DataView} secret ~ data to use in kdf
 *  @param {string|Buffer|TypedArray|DataView} salt  ~ salt to use in kdf
 *  @param {number} len ~ output length
 *  @param {function} callback ~ optional | no callback for Sync | function(err,res)
 **/

 const { server, router, crypt } = require('sicarii/main');

 // sync
 let res = crypt.pbkdf2('data', 'secret', 32);

 console.log(
   res
 )

 // async
 crypt.pbkdf2('data', 'secret', 32, function(err,res){
   console.log(res)
 });

```

#### crypt.scrypt()

crypt.scrypt provides a sync/async Password-Based Key Derivation Function implementation

* `config.crypt.scrypt` contains a list of default options which must be valid to nodejs

```js

/**
 *  @crypt.scrypt(secret, salt, len, callback)
 *
 *  @param {string|Buffer|TypedArray|DataView} secret ~ data to use in kdf
 *  @param {string|Buffer|TypedArray|DataView} salt  ~ salt to use in kdf
 *  @param {number} len ~ output length
 *  @param {function} callback ~ optional | no callback for Sync | function(err,res)
 **/

 const { server, router, crypt } = require('sicarii/main');

 // sync
 let res = crypt.scrypt('data', 'secret', 32);

 console.log(
   res
 )

 // async
 crypt.scrypt('data', 'secret', 32, function(err,res){
   console.log(res)
 });

```

#### crypt.jwt

crypt.jwt can be used to generate or verify json web tokens

* `config.crypt.jwt` contains a list of default options which must be valid to nodejs
* `config.crypt.jwt.encode` use hex/base64 encoding for jwt
* `config.crypt.jwt.secret` is the secret used to hmac your jwt data
* `config.crypt.jwt.digest` valid nodejs digest to use
* `config.crypt.jwt.header` jwt header includes
* `config.crypt.jwt.claims` jwt public claims
* you can add extra default plublic claims to `config.crypt.jwt.claims`
* `config.crypt.jwt.claims.exp` is a `mandatory` time till expires in milliseconds
* `config.crypt.jwt.claims.nbf` is a `optional` time before valid in milliseconds

* `config.crypt.jwt.claims.exp` is mandatory, all other  added are optional

* `config.crypt.jwt.claims.iat` is automatically generated

#### crypt.jwt.sign()

```js

/**
 *  @crypt.jwt.sign(data, callback)
 *
 *  @param {object} data ~ extra claims to be added to jwt
 *  @param {function} callback ~ optional | function(err,res)
 **/

 const { server, router, crypt } = require('sicarii/main');


 // optional private claims ~ empty object for no extra claims {}
 let jwt_private = {
   name: 'some name',
   age: 999
 }

 // sync
 let sig = crypt.jwt.sign(jwt_private)

 console.log(sig)
 // returns valid jwt || null for error


 // async
 crypt.jwt.sign(jwt_private, function(err,sig){
   if(err){console.log(err)}
   console.log(sig)
 })

```


#### crypt.jwt.verify()

```js

/**
 *  @crypt.jwt.verify(sig, callback)
 *
 *  @param {string} sig ~ jwt data to be verified
 *  @param {function} callback ~ optional | function(err,res)
 **/

 const { server, router, crypt } = require('sicarii/main');

 // optional private claims ~ empty object for no extra claims {}
 let jwt_private = {
   name: 'some name',
   age: 999
 },
 sig = crypt.jwt.sign(jwt_private); // test jwt

 //sync
 console.log(crypt.jwt.verify(sig))
 // returns null for error || false for invalid, expired or nbf || jwt obj for pass

 //async
 crypt.jwt.verify(sig, function(err,is_valid){
   if(err){return console.error(err)}
   if(is_valid){
     console.log(is_valid);
    //jwt obj for pass
  } else {
    //invalid jwt
  }
 })

```

#### encryption (symmetric)

* encrypt/decrypt settings can be configured at `config.encryption`
* `config.encryption.modes` includes `gcm|cbc|ccm|ctr|cfb|cfb1|cfb8|ocb|ofb`
* `config.encryption.cipher` includes `aes|aria|camellia`
* `config.encryption.bit_len` includes `128|192|256`
* `config.encryption.iv_len` is the accepted iv length for your options
* `config.encryption.tag_len` is the accepted auth-tag length for your mode | if needed
* `config.encryption.encode` encoding of your secret and encrypted data

* be aware that most of the different modes require you to alter other options.

#### crypt.keygen()

create an encryption key to be used for symmetric encryption and decryption

* `config.encryption.secret_len` the correct key length for your encryption
* `config.encryption.iterations` pbkdf2 iterations for creating secure key
* `config.encryption.digest` hash digest used for creating secure key
* `config.encryption.settings.encode` encoding for key/encryption

* a generated key can be manually added to `config.encryption.secret` for access via `app.config`

```js

 const { server, router, crypt } = require('sicarii/main');


 let secret = crypt.keygen();

 console.log(secret);


```

#### crypt.encrypt()

encrypt data

```js

/**
 *  @crypt.encrypt(data, secret, callback)
 *
 *  @param {string|buffer} data ~ data to be encrypted
 *  @param {string} secret ~ correctly encoded encryption key
 *  @param {function} callback ~ optional | function(err,res)
 **/

 const { server, router, crypt } = require('sicarii/main');

 let data = 'test', // data to be encrypted
 secret = crypt.keygen(); // generate new secure encryption key

 // sync
 let ctext = crypt.encrypt(data,secret);
 console.log(ctext)
 // encrypted data || undefined if error

 //async
 crypt.encrypt(data, secret, function(err,res){
   if(err){return console.error(err)}
   console.log(ctext)
   // encrypted data
 });
```


#### crypt.decrypt()

decrypt encrypted data

```js

/**
 *  @crypt.decrypt(data, secret, callback)
 *
 *  @param {string|buffer} data ~ data to be decrypted
 *  @param {string} secret ~ correctly encoded encryption key
 *  @param {function} callback ~ optional | function(err,res)
 **/

 const { server, router, crypt } = require('sicarii/main');

 let data = 'test',
 secret = crypt.keygen(),
 ctext = crypt.encrypt(data,secret); // encrypted data


 //sync
let ptext = crypt.decrypt(ctext, secret);
console.log(ptext)
// test || undefined for error

 //async
 crypt.decrypt(ctext, secret, function(err,ptext){
   if(err){return console.error(err)}
   console.log(ptext)
   // test || undefined for error
 });
```

#### encryption (asymmetric)

* `config.rsa.length` the rsa modulusLength 2048|4096|8192|16384
* `config.rsa.publicExponent` default 65537
* `config.rsa.oaepHash` hash digest used for rsa-oaep encryption
* `config.rsa.encode` encoding for key/encryption hex|base64
* `config.rsa.publicKey` accepts all valid nodejs rsa publicKey settings
* `config.rsa.privateKey` accepts all valid nodejs rsa privateKey settings

#### crypt.rsa.create

create an encryption key pair to be used for asymmetric rsa-oaep encryption and decryption

```js

/**
 *  @crypt.rsa.create(callback)
 *  @param {function} callback ~ generated keys | function(err,res)
 **/

 const { crypt } = require('sicarii/main');

 // generate keypair for rsa-oaep
 crypt.rsa.create(function(err,keys){
   if(err){return console.log(err)}

   console.log(keys.publicKey)
   console.log(keys.rivateKey)
 })


```

#### crypt.rsa.encrypt

encrypt data using rsa-oaep encryption

```js

/**
 *  @crypt.rsa.encrypt(publicKey,ptext,callback)
 *  @param {string} publicKey ~ publicKey used to encrypt data
 *  @param {string|buffer} ptext ~ plain text/buffer | data to be encrypted
 *  @param {function} callback ~ cipher text | function(err,res)
 **/

 const { crypt } = require('sicarii/main');

 // generate keypair for rsa-oaep
 crypt.rsa.create(function(err,keys){
   if(err){return console.log(err)}

   crypt.rsa.encrypt(keys.publicKey, 'test data', function(err,ctext){
     if(err){return console.log(err)}
     console.log(ctext) // encrypted cipher text

   })
 })


```

#### crypt.rsa.decrypt

decrypt data using rsa-oaep encryption

```js
/**
 *  @crypt.rsa.decrypt(privateKey,ctext,callback)
 *  @param {string} privateKey ~ privateKey used to decrypt data
 *  @param {string} ctext ~ encoded data to be decrypted
 *  @param {function} callback ~ plain text | function(err,res)
 **/

 const { crypt } = require('sicarii/main');

 // generate keypair for rsa-oaep
 crypt.rsa.create(function(err,keys){
   if(err){return console.log(err)}

   crypt.rsa.encrypt(keys.publicKey, 'test data', function(err,ctext){
     if(err){return console.log(err)}
     console.log(ctext)

     crypt.rsa.decrypt(keys.privateKey, ctext, function(err,ptext){
       if(err){return console.log(err)}
       console.log(ptext) // 'test data'
     })

   })
 })


```


#### crypt.ecdsa

* `config.crypt.ecdsa` contains the ecdsa defaults
* `config.crypt.ecdsa.curve` is the ecdsa curve used
* `config.crypt.ecdsa.encode` is the encoding used for input and output
* `config.crypt.ecdsa.hash` is the hash used to sign data
* `config.crypt.ecdsa.publicKey` accepts all nodejs ecdsa publicKey options
* `config.crypt.ecdsa.privateKey` accepts all nodejs ecdsa privateKey options

#### crypt.ecdsa.create()

create elliptic curve keypair

```js
/**
 *  @crypt.ecdsa.create(callback)
 *
 *  @param {function} callback ~ function(err,keypair)
 **/

 const { server, router, crypt } = require('sicarii/main');

 // generate ec keypair async
 crypt.ecdsa.create(function(err, keypair){
   if(err){return console.error(err)}

   // do something with keypair
   console.log(keypair)

 })

```

#### crypt.ecdsa.sign()

create elliptic curve signature

```js
/**
 *  @crypt.ecdsa.sign(privateKey, data, callback)
 *
 *  @param {string} privateKey ~ encoded private key
 *  @param {string} data ~ data to sign with private key
 *  @param {function} callback ~ function(err,sig) || optional
 **/

 const { server, router, crypt } = require('sicarii/main');


 // generate ecdsa keypair async
 crypt.ecdsa.create(function(err, keypair){
   if(err){return console.error(err)}

   // sign some data async
   crypt.ecdsa.sign(keypair.privateKey, 'data', function(err,sig){
     if(err){return console.error(err)}
     // signed data
     console.log(sig);

    })
 })


```

#### crypt.ecdsa.verify()

verify data integrity

```js
/**
 *  @crypt.ecdsa.verify(publicKey, sig, data, callback)
 *
 *  @param {string} privateKey ~ encoded private key
 *  @param {string} sig ~ data signature
 *  @param {string} data ~ data to verify with public key
 *  @param {function} callback ~ function(err,isValid) || optional
 **/
 const { server, router, crypt } = require('sicarii/main');

 let data = 'test data'
 // generate ec keypair async
 crypt.ecdsa.create(function(err, keypair){
   if(err){return console.error(err)}

   // sign some data
   crypt.ecdsa.sign(keypair.privateKey, data, function(err,sig){
     if(err){return console.error(err)}

     // verify some data against sig
     crypt.ecdsa.verify(res.publicKey, sig, data, function(err, isValid){
       if(err){return console.error(err)}
       console.log(isValid);
       // true/false
     })

    })
 })


```

#### crypt.ecdh

Elliptic Curve Diffie-Hellman (ECDH) key exchange

* `config.crypt.ecdh` contains the ecdh defaults
* `config.crypt.ecdh.curve` is the ecdh curve used
* `config.crypt.ecdh.encode` is the encoding used for input and output


#### crypt.ecdh.create()

create ecdh keypair

```js
/**
 *  @crypt.ecdh.create(callback)
 *
 *  @param {function} callback ~ function(err,keypair) | optional
 **/

 const { server, router, crypt } = require('sicarii/main');

 // generate ecdh keypair async
 crypt.ecdh.create(function(err, keypair){
   if(err){return console.error(err)}

   // do something with keypair
   console.log(keypair)

 })

 // generate ecdh keypair sync
 console.log(crypt.ecdh.create())

```

#### crypt.ecdh.compute()

compute ecdh secret

```js
/**
 *  @crypt.ecdh.compute(privateKey, publicKey, callback)
 *  @param {string} privateKey ~ encoded privateKey
 *  @param {string} publicKey  ~ encoded publicKey
 *  @param {function} callback ~ function(err,secret) | optional
 **/

 const { server, router, crypt } = require('sicarii/main');

 // generate ecdh keypair async
 crypt.ecdh.create(function(err,alice){
   if(err){return console.log(err)}
   console.log(alice)

   crypt.ecdh.create(function(err,bob){
     if(err){return console.log(err)}

     // compute secret sync
     let alice_secret = crypt.ecdh.compute(alice.privateKey, bob.publicKey),
     bob_secret = crypt.ecdh.compute(bob.privateKey, alice.publicKey);

     // verify secrets
     console.log(alice_secret === bob_secret)


     // compute secret async
     crypt.ecdh.compute(alice.privateKey, bob.publicKey, function(err,secret){
       if(err){return console.error(err)}
       console.log(secret)
     })

   })
 })

```

#### crypt.otp

one time pad (OTP)

* `config.crypt.otp` contains the otp defaults
* `config.crypt.otp.iterations` is the iteration count for generating a secure pad
* `config.crypt.otp.digest` is the digest used for generating a secure pad
* `config.crypt.otp.rounds` is the encrypt/decrypt rounds count
* `config.crypt.otp.encode` is the encoding used for input of decryption,
  output of encryption and the pad.
* the pad created must be at least the length of the text to be encrypted

#### crypt.otp.pad()

generate pad ofor OTP encryption

```js
/**
 *  @crypt.otp.pad(len, callback)
 *  @param {number} len ~ OTP pad length
 *  @param {function} callback ~ function(err,pad)
 **/

 const { server, router, crypt } = require('sicarii/main');

 let data = 'test'

 // generate pad to be used
 crypt.otp.pad(data.length, function(err,pad){
   if(err){return console.log(err)}
   console.log(pad) // returns encoded pad

 })

```

#### crypt.otp.encrypt()

encrypt data using generated pad

```js
/**
 *  @crypt.otp.encrypt(data, key, callback)
 *  @param {string|buffer} data ~ OTP data to be encrypted
 *  @param {string} key ~ encoded OTP pad
 *  @param {function} callback ~ function(err,cdata)
 **/

 const { server, router, crypt } = require('sicarii/main');

 let data = 'test'

 crypt.otp.pad(data.length, function(err,pad){
   if(err){return console.log(err)}

   // encrypt data with generated pad
   crypt.otp.encrypt(data, pad, function(err, cdata){
     if(err){return console.error(err)};
     console.log(cdata) // returns encoded and encrypted data

   })

 })

```

#### crypt.otp.decrypt()

decrypt data using generated pad and ciphertext

```js
/**
 *  @crypt.otp.decrypt(data, key, callback)
 *  @param {string|buffer} data ~ OTP encoded and encrypted data
 *  @param {string} key ~ encoded OTP pad
 *  @param {function} callback ~ function(err,data)
 **/

 const { server, router, crypt } = require('sicarii/main');

 let data = 'test'

 crypt.otp.pad(data.length, function(err,pad){
   if(err){return console.log(err)}

   crypt.otp.encrypt(data, pad, function(err, cdata){
     if(err){return console.error(err)};

     // decrypt data with generated pad and encoded ciphertext
     crypt.otp.decrypt(cdata, pad, function(err, pdata){
       if(err){return console.error(err)};
       console.log(pdata) // returns decrypted data as buffer
       console.log(pdata.toString() === data) // true
     })

   })

 })

```