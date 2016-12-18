const config = require('./config');
const Sequelize = require('sequelize');

const db = new Sequelize(config.db.url, {
  logging: false
});

module.exports = db;
