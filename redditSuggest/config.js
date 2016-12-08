const extend = require('extend');

let config = {
  pg: {
    user: 'yawhide',
    database: 'postgres',
    host: 'localhost',
    port: '5432',
    max: 25,
    idleTimeoutMillis: 30000
  },
  reddit: {
    clientSecret: '???',
    clientId: '???',
    userAgent: 'nodejs:UFHteMd7xbl14A:v0.0.1 (by /u/yawhide)',
    username: '???',
    password: '???'
  }
};

extend(true, config, require('./config.json'));

module.exports = config;
