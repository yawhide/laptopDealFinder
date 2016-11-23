const path = require('path');
const rootPath = path.normalize(__dirname + '/..');
const env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'laptopdealmongo'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost:27017/laptopdealmongo-development'
  },

  test: {
    root: rootPath,
    app: {
      name: 'laptopdealmongo'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost:27017/laptopdealmongo-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'laptopdealmongo'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost:27017/laptopdealmongo-production'
  }
};

module.exports = config[env];
