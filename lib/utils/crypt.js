const crypto = require('crypto'),
config = require(process.env.config_file);

const crypt = {
  hmac: {
    sign: function(data, secret){
      try {
        let cnf = config.crypt.hmac;
        secret = secret || cnf.secret;
        return crypto.createHmac(cnf.digest, secret).update(data).digest(cnf.encode);
      } catch (err) {
        return null
      }
    },
    verify: function(data, sig, secret){
      try {
        let cnf = config.crypt.hmac;
        secret = secret || cnf.secret;
        return crypt.hmac.sign(data, secret) === sig;
      } catch (err) {
        return null
      }
    }
  },
  jwt: {
    sign: function(claims, cb){
      try {

        let cnf = config.crypt.jwt,
        tm = Date.now(),
        header = JSON.stringify(cnf.header),
        final, sig;

        claims = Object.assign(cnf.claims, claims);

        claims.iat = tm;
        claims.exp = (tm + claims.exp);

        if(claims.nbf){
          claims.nbf = (tm + claims.nbf);
        }

        claims = JSON.stringify(claims);

        final = [
          Buffer.from(header).toString(cnf.encode),
          Buffer.from(claims).toString(cnf.encode)
        ].join(cnf.separator);

        sig = crypto.createHmac(cnf.digest, cnf.secret).update(final).digest(cnf.encode);
        sig = [final, sig].join(cnf.separator)

        if(cb){
          return cb(false, sig);
        }
        return sig;

      } catch (err) {
        if(cb){
          return cb(err);
        }
        return null;
      }


    },
    verify: function(sig, cb){
      try {
        let cnf = config.crypt.jwt,
        tm = Date.now(),
        final, validate;

        sig = sig.split(cnf.separator);

        validate = [sig[0], sig[1]].join(cnf.separator)

        final = crypto.createHmac(cnf.digest, cnf.secret).update(validate).digest(cnf.encode);

        if(final === sig[2]){
          final = JSON.parse(Buffer.from(sig[1], cnf.encode).toString());
          if(final.exp < tm || final.nbf && final.nbf > tm){
            final = false;
          }
          if(cb){
            return cb(false, final);
          }
          return final;
        } else {
          if(cb){
            return cb(false, false);
          }
          return false;
        }
      } catch (err) {
        if(cb){
          return cb(err);
        }
        return null;
      }
    }
  },
  pbkdf2: function(secret, salt, len, cb){
    let cnf = config.crypt.pbkdf2;
    if(!cb){
      try {
        let res = crypto.pbkdf2Sync(secret, salt, cnf.iterations, len, cnf.digest)
        if(cnf.encode !== ''){
          res = res.toString(cnf.encode)
        }
        return res;
      } catch (err) {
        return null
      }
    } else {
      crypto.pbkdf2(secret, salt, len, {}, function(err,res){
        if(err){return cb(err)}
        if(cnf.encode !== ''){
          res = res.toString(cnf.encode)
        }
        cb(false, res)
      })
    }
  },
  scrypt: function(secret, salt, len, cb){
    let cnf = config.crypt.scrypt;
    if(!cb){
      try {
        let res = crypto.scryptSync(secret, salt, len, {
          cost: cnf.cost,
          blockSize: cnf.blockSize,
          parallelization: cnf.parallelization
        })
        if(cnf.encode !== ''){
          res = res.toString(cnf.encode)
        }
        return res;
      } catch (err) {
        return null
      }
    } else {
      crypto.scrypt(secret, salt, len, {
        cost: cnf.cost,
        blockSize: cnf.blockSize,
        parallelization: cnf.parallelization
      },function(err,result){
        if(err){return cb(err)}
        if(cnf.encode !== ''){
          result = result.toString(cnf.encode)
        }
        cb(false, result);
      })
    }
  },
  rnd: function(len, encode){
    try {
      let res = crypto.randomBytes(len);
      if(encode){
        res = res.toString(encode)
      }
      return res;
    } catch (err) {
      return null
    }
  },
  encrypt: function(text, key, cb) {
    try {
      let cnf = config.crypt.encryption,
      defaults = cnf.settings;

      const iv = crypto.randomBytes(defaults.iv_len),
      cipher = crypto.createCipheriv(
        [defaults.cipher, defaults.bit_len, defaults.mode].join('-'),
        Buffer.from(key, defaults.encode),
        iv,
        {authTagLength: defaults.tag_len}
      ),
      encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

      let final;
      if(['gcm', 'ocb', 'ccm'].indexOf(defaults.mode) !== -1){
        final = [iv, cipher.getAuthTag(), encrypted]
      } else {
        final = [iv, encrypted]
      }

      final =  Buffer.concat(final).toString(defaults.encode);

      if(cb){
        return cb(false, final);
      }
      return final;

    } catch(err){
      if(err){
        if(cb){
          return cb(err)
        }
        return undefined;
      }
    }
  },
  decrypt: function(encdata, key, cb) {
    try {
      let cnf = config.crypt.encryption,
      defaults = cnf.settings,
      ptext;

      encdata = Buffer.from(encdata, defaults.encode);
      const decipher = crypto.createDecipheriv(
        [defaults.cipher, defaults.bit_len, defaults.mode].join('-'),
        Buffer.from(key, defaults.encode),
        encdata.slice(0, defaults.iv_len),
        {authTagLength: defaults.tag_len}
      );

      if(['gcm', 'ocb', 'ccm'].indexOf(defaults.mode) !== -1){
        let tag_slice = defaults.iv_len + defaults.tag_len;
        decipher.setAuthTag(encdata.slice(defaults.iv_len, tag_slice));
        ptext = decipher.update(encdata.slice(tag_slice), 'binary', 'utf8') + decipher.final('utf8');
      } else {
        ptext = decipher.update(encdata.slice(defaults.iv_len), 'binary', 'utf8') + decipher.final('utf8');
      }

      if(cb){
        return cb(false, ptext);
      }

      return ptext;

    } catch (err) {
      if(err){
        if(cb){
          return cb(err)
        }
        return undefined;
      }
    }
  },
  keygen: function(){
    let cnf = config.crypt.encryption;

    return crypto.pbkdf2Sync(
      crypto.randomBytes(cnf.secret_len),
      crypto.randomBytes(cnf.secret_len),
      cnf.iterations, cnf.secret_len, cnf.digest
    ).toString(cnf.settings.encode);

  },
  ecdsa: {
    create: function(cb){
      let cnf = config.crypt.ecdsa;

      crypto.generateKeyPair('ec', {
        namedCurve: cnf.curve,
        publicKeyEncoding: cnf.publicKey,
        privateKeyEncoding: cnf.privateKey
      }, function(err, publicKey, privateKey){
        if(err){return cb(err)}
        let obj = {
          privateKey: privateKey.toString(cnf.encode),
          publicKey: publicKey.toString(cnf.encode)
        }
        cb(false, obj)
      })

    },
    sign: function(key, data, cb){
      try {
        let cnf = config.crypt.ecdsa,
        obj = cnf.privateKey;

        obj.key = Buffer.from(key, cnf.encode);
        key = crypto.createPrivateKey(obj);
        key = crypto.createSign(cnf.hash).update(data).sign(key, cnf.encode);

        if(cb){return cb(false, key)};
        return key;
      } catch (err) {
        if(err){
          if(cb){return cb(err)}
          return null;
        }
      }
    },
    verify: function(key, sig, data, cb){
      try {
        let cnf = config.crypt.ecdsa,
        obj = cnf.publicKey;

        obj.key = Buffer.from(key, cnf.encode);
        key = crypto.createPublicKey(obj);
        key = crypto.createVerify(cnf.hash).update(data).verify(key, sig, cnf.encode);

        if(cb){
          return cb(false, key)
        }
        return key;
      } catch (err) {
        if(err){
          if(cb){return cb(err)}
          return false;
        }
      }
      return obj;
    }
  },
  ecdh: {
    create: function(cb){
      try {
        let cnf = config.crypt.ecdh,
        obj = crypto.createECDH(cnf.curve);
        obj.generateKeys();
        obj = {
          publicKey: obj.getPublicKey(cnf.encode),
          privateKey: obj.getPrivateKey(cnf.encode)
        }
        if(cb){
          return cb(false, obj);
        }
        return obj;
      } catch (err) {
        if(cb){return cb(err);}
        return null;
      }
    },
    compute: function(privateKey, publicKey, cb){
      try {
        let cnf = config.crypt.ecdh,
        obj = crypto.createECDH(cnf.curve);
        obj.setPrivateKey(privateKey, cnf.encode)
        return obj.computeSecret(publicKey, cnf.encode, cnf.encode);
      } catch (err) {
        if(cb){return cb(err)}
        return null;
      }
    }
  }
}

module.exports = crypt;
