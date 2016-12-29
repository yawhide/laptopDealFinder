const _ = require('lodash');
const log = require('better-logs')('sql-helper');
const pgFormat = require('pg-format');

function runSql (db, methodName, text, cb) {
  db.query(text, (err, result) => {
    if (err) {
      log.error(`${methodName}:`, err);
      log.debug(text);
      return cb(err);
    }
    cb(null, result.rows);
  });
}

// ========================= EXPORTS =========================

exports.bulkCreate = function (db, tableName, records, cb) {
  if (!_.get(records, 'length')) return cb();
  let sql = createBulkCreateSql(tableName, records);
  runSql(db, 'bulkCreate', sql, cb);
}

exports.create = function (db, tableName, values, cb) {
  let sql = createCreateSql(tableName, values);
  runSql(db, 'create', sql, cb);
}

exports.getAll = function (db, tableName, cb) {
  let sql = createGetAllSql(tableName);
  runSql(db, 'getAll', sql, cb);
}

// ========================= HELPER =========================

function createBulkCreateSql (table, arrOfValues) {
  let keys = Object.keys(arrOfValues[0]);
  let values = arrOfValues.map(values => {
    return keys.map(key => values[key]);
  });
  return pgFormat(`INSERT INTO ${table} (${keys.join(',')}) VALUES %L;`, values);
}

function createCreateSql (table, values) {
  return createBulkCreateSql(table, [values]);
}

function createGetAllSql (table) {
  return `SELECT * FROM ${table};`;
}
