module.exports = {
  server: require('./lib/server').server,
  router: require('./lib/server').router,
  app: require('./lib'),
  cluster: require('cluster')
}
