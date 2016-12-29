const _ = require('lodash');
const db = require('../db.js');
const log = require('better-logs')('model-comments');
const pgFormat = require('pg-format');
const sqlHelper = require('../library/sql-helper');

const schema = `
  author          text,
  body_html       text,
  comment_id      text NOT NULL,
  created_at      timestamp DEFAULT now()::timestamp,
  created_utc     timestamp,
  link_id         text,
  name_id         text,
  processed       boolean DEFAULT false,
  subreddit       text,
  subreddit_id    text NOT NULL,
  thread_id       text NOT NULL,
  updated_at      timestamp,
  urls            text[],

  PRIMARY KEY (comment_id, subreddit_id, thread_id)
`;
const tableName = 'comments';

exports.init = function () {
  return [
    { text: `CREATE TABLE IF NOT EXISTS ${tableName} (${schema});` },
    { text: `
        CREATE OR REPLACE FUNCTION set_updated_at()
          RETURNS TRIGGER
          LANGUAGE plpgsql
        AS $$
        BEGIN
          NEW.updated_at := now()::timestamp;
          RETURN NEW;
        END;
        $$;
      ` },
    { text: `
        CREATE TRIGGER ${tableName}_update_at
        BEFORE UPDATE ON ${tableName}
        FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
      ` }
  ];
};

exports.bulkCreate = function(records, cb) {
  if (!_.get(records, 'length')) return cb();
  let keys = Object.keys(records[0]);
  let values = records.map(obj => {
    let row = keys.map(key => {
      let val = obj[key];
      if (_.isArray(val)) {
        return pgFormat(`ARRAY[%L]`, val);
      }
      return pgFormat('%L', val);
    });
    return `(${row.join(',')})`;
  });
  if (values.length > 1) {
    values.join(',');
    values = `(${values})`;
  }
  let sql = `INSERT INTO ${tableName} (${keys.join(',')}) VALUES ${values};`;
  db.query(sql, (err, result) => {
    if (err) {
      log.error('bulkCreate:', err);
      log.debug(sql);
      return cb(err);
    }
    cb(null, result);
  });
}

exports.create = function(values, cb) {
  exports.bulkCreate([values], cb);
}

exports.getAll = function (cb) {
  sqlHelper.getAll(db, tableName, cb);
}

exports.update = function (primaryKeyObj, updates, cb) {
  let keys = Object.keys(updates);
  let values = keys.map(key => pgFormat(`%I = %L`, key, updates[key]));

  let sql = pgFormat(`UPDATE ${tableName} SET ${values.join(' , ')} WHERE comment_id = %L and subreddit_id = %L and thread_id = %L;`, primaryKeyObj.comment_id, primaryKeyObj.subreddit_id, primaryKeyObj.thread_id);
  db.query(sql, (err, result) => {
    if (err) {
      log.error('update:', err);
      log.debug(sql);
      return cb(err);
    }
    cb(null, result);
  });
}

exports.updateUrls = function (id, urls, cb) {
  throw new Error('deprecated');
  let sql = pgFormat(`UPDATE ${tableName} SET urls = ARRAY[%L] WHERE id = ${id};`, urls);
  db.query(sql, (err, result) => {
    if (err) {
      log.error('updateUrls:', err);
      log.debug(sql);
      return cb(err);
    }
    cb(null, result);
  });
}

// ========================= SEPCIAL =========================

exports.getNonProcessed = function (cb) {
  let sql = `SELECT * FROM comments WHERE processed = false and urls NOTNULL;`;
  db.query(sql, (err, result) => {
    if (err) {
      log.error('getNonProcessed:', err);
      return cb(err);
    }
    cb(null, result.rows);
  });
}

exports.groupByUrl = function (cb) {

}

exports.validate = function (row) {
  const keys = Object.keys(schema);
  for (var i = 0; i < keys.length; i++) {
    let curKey = keys[i];
    if (schema[curKey].allowNull === false && !_.get(row, [curKey])) return false;
  }
  return true;
}
