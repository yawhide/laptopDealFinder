const _ = require('lodash');
const async = require('async');
const Comments = require('./comments');
const db = require('../db.js');
const log = require('better-logs')('model-laptops');
const pgFormat = require('pg-format');
const qs = require('qs');
const sqlHelper = require('../library/sql-helper');
const url = require('url');
const Xray = require('x-ray');

const xray = Xray();

const schema = `
  brand               text,
  created_at          timestamp DEFAULT now()::timestamp,
  cpu                 text,
  display_resolution  text,
  display_size        text,
  operating_system    text,
  price               decimal(6,2),
  ram                 integer,

  store               text NOT NULL,
  store_id            text NOT NULL,
  title               text,
  updated_at          timestamp,
  url                 text NOT NULL,

  PRIMARY KEY (store, store_id)
`;
const tableName = 'laptops';
/*
  // make sure we use a global name for these fields, like intel i5 or 8gb so we get groups laptops more easily
  brand:              { type: Sequelize.STRING },
  cpu:                { type: Sequelize.STRING },
  display_size:       { type: Sequelize.STRING }, // has decimals dd.d"
  display_resolution: { type: Sequelize.STRING }, // ddddXdddd
  operating_system:   { type: Sequelize.STRING },
  ram:                { type: Sequelize.INTEGER }, // dd gb
*/

exports.init = function () {
  return [
    { text: `CREATE TABLE IF NOT EXISTS ${tableName} (${schema});` },
    { text: `
        CREATE TRIGGER ${tableName}_update_at
        BEFORE UPDATE ON ${tableName}
        FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
      ` }
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

exports.bulkCreateFromComment = function (comment, cb) {
  let values = [];
  let comment_id = comment.id;
  // log.debug(comment)
  if (!comment.urls) return cb();
  // async.eachLimit(comment.urls, 1,
  const q = new async.queue((uri, queueCB) => {
    // log.debug(uri)
    let parsedUri = url.parse(uri.toLowerCase());
    let store = store_id = title = finalUrl = '';
    if (uri.indexOf('amazon') > -1) {
      let pathname = parsedUri.pathname;
      let splitted = pathname.split('/');
      if ('s' === splitted[1]) {
        // [ 'https:', '', 'www.amazon.com', 's', 'ref=sr_ex_n_1' ]
        log.debug('weird url:', uri);
        return queueCB();
      } else if (splitted.length < 3) {
        log.debug('weird url:', uri);
        return queueCB();
      } else if ('gp' === splitted[1]) {
        //[ 'https:', '', 'www.amazon.com', 'gp', 'product', 'B01KZ6BFJI' ]
        if (splitted[2] === 'product') {
          store_id = removeEncodedSuffix(splitted[3]);
        } else {
          store_id = removeEncodedSuffix(splitted[2]);
        }
        finalUrl = `${parsedUri.protocol}//${parsedUri.hostname}/dp/${store_id}`;
      } else if ('dp' === splitted[1]) {
        //[ 'https:', '', 'www.amazon.com', 'dp', 'B01N3S4IVX', 'ref=as_li_ss_tl' ]
        store_id = removeEncodedSuffix(splitted[2]);
        finalUrl = `${parsedUri.protocol}//${parsedUri.hostname}/dp/${store_id}`;
      } else if (splitted.length < 4) {
        log.debug('weird url:', uri);
        return queueCB();
      } else {
        if (splitted[3] === 'product' && splitted.length > 4) {
          store_id = removeEncodedSuffix(splitted[4]);
        } else {
          store_id = removeEncodedSuffix(splitted[3]);
        }
        title = splitted[1];
        finalUrl = `${parsedUri.protocol}//${parsedUri.hostname}/dp/${store_id}`;
      }
      store = 'amazon';
    } else if (uri.indexOf('newegg') > -1) {
      let query = parsedUri.query;
      let parsedQuery = qs.parse(query);
      store = 'newegg';
      store_id = parsedQuery.item;
      if (!store_id) return queueCB();
      finalUrl = `${parsedUri.protocol}//${parsedUri.hostname}/Product/Product.aspx?item=${store_id}`;
    } else if (uri.indexOf('shopineer') > -1) {
      xray(uri, '#sample_1 > tbody > tr', [{
        // price: 'td.dt-right > a',
        url: 'td:nth-child(3) > a@href'
      }])(function (err, obj) {
        // log.debug(err, obj)
        if (err) {
          log.error(err);
          return queueCB(err);
        }
        let i = 0;
        for (; i < obj.length; i++) {
          let newUri = _.get(obj[i], 'url');
          if (newUri) {
            if (newUri.indexOf('amazon') > -1 || newUri.indexOf('newegg') > -1) {
              q.push(newUri);
            }
          }
        }
        queueCB();
      });
      return;
    } else {
      log.debug('weird url:', uri);
      return queueCB();
    }

    let data = [
      store,
      store_id,
      title || '', //title
      finalUrl //url
    ];
    values.push(data);
    queueCB();
  });

  q.drain = function (err) {
    if (err) process.exit(1);
    if (!values.length) return cb();
    let sql = pgFormat(`INSERT INTO ${tableName} (store, store_id, title, url) VALUES %L ON CONFLICT DO NOTHING;`, values);
    db.query(sql, (err, result) => {
      if (err) {
        log.error(err);
        log.debug(sql);
        log.debug(values)
        process.exit(1);
        return;
      }
      sql = pgFormat(`INSERT INTO comments_laptops (comment_id, subreddit_id, thread_id, store, store_id) VALUES %L ON CONFLICT DO NOTHING;`, values.map(value => [comment.comment_id, comment.subreddit_id, comment.thread_id].concat(value.slice(0, 2))));
      db.query(sql, (err, result) => {
        if (err) {
          log.error(err);
          log.debug(sql);
          process.exit(1);
          return;
        }
        log.info('successfully inserted', values.length, 'laptop(s). comment finished:', comment.id);
        cb();
      });
    });
  };
  q.push(comment.urls);
  // log.debug('done pushing');
  // comment.urls.forEach(uri => {
  //   q.push(uri);
  // });
}

exports.getByCommentId = function (commentId, cb) {
  let sql = `SELECT FROM laptops WHERE comment_id = ${commentId} LIMIT 1;`;
  db.query(sql, (err, result) => {
    if (err) {
      log.error('getByCommentId:', err);
      return cb(err);
    }
    if (result.rowCount === 0) return cb();
    log.debug(result)
    cb(null, result.rows[0]);
  });
}

function removeEncodedSuffix (storeId) {
  let suffixIndex = storeId.indexOf('%3f');
  if (suffixIndex > -1) {
    storeId = storeId.substring(0, suffixIndex);
  }
  return storeId;
}
