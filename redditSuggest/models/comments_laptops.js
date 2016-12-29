const _ = require('lodash');
const db = require('../db.js');
const log = require('better-logs')('model-comments_laptops');
const pgFormat = require('pg-format');
const sqlHelper = require('../library/sql-helper');

const schema = `
  comments_id       integer NOT NULL,
  laptops_store     text NOT NULL,
  laptops_store_id  text NOT NULL,

  PRIMARY KEY (comments_id, laptops_store, laptops_store_id)
`;
const tableName = 'comments_laptops';

exports.init = function () {
  return [
    { text: `CREATE TABLE IF NOT EXISTS ${tableName} (${schema});` }
  ];
};

exports.bulkCreate = function(records, cb) {
  if (!_.get(records, 'length')) return cb();
  sqlHelper.bulkCreate(db, tableName, records, cb);
}

exports.create = function(values, cb) {
  sqlHelper.create(db, tableName, values, cb);
}

exports.getAll = function (cb) {
  sqlHelper.getAll(db, tableName, cb);
}

// ========================= SEPCIAL =========================
