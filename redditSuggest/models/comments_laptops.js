const _ = require('lodash');
const db = require('../db.js');
const log = require('better-logs')('model-comments_laptops');
const pgFormat = require('pg-format');
const sqlHelper = require('../library/sql-helper');

const schema = `
  comment_id   text NOT NULL,
  subreddit_id text NOT NULL,
  thread_id    text NOT NULL,
  store        text NOT NULL,
  store_id     text NOT NULL,

  PRIMARY KEY (comment_id, subreddit_id, thread_id, store, store_id)
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

exports.getAllMentions = function (cb) {
  let sql = `
    SELECT t.*, c FROM laptops t
    JOIN (
      SELECT COUNT(store_id) AS c, store_id, store
      FROM laptops
      NATURAL JOIN comments_laptops
      GROUP BY store_id, store ORDER BY c DESC
    ) a ON
      a.store_id = t.store_id AND
      a.store = t.store;`;
  db.query(sql, (err, result) => {
    if (err) {
      log.error(`getAllMentions:`, err);
      log.debug(sql);
      return cb(err);
    }
    cb(null, result.rows);
  });
}
