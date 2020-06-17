module.exports = {
  server: require('./lib/server').server,
  router: require('./lib/server').router,
  crypt: require('./lib/utils/crypt')
}
