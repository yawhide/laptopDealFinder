const _ = require('lodash');
const async = require('async');
const format = require('pg-format');

let db;
let prepCallbacks = [];

// laptops
  // model varchar(255) NOT NULL,
  // mentions integer DEFAULT 1,
  // price numeric(10, 2),
  // url text,
  // brand varchar(100),
  // release_date date,
  // screen_size varchar(10),

const threadsSchema = `
  created_utc timestamp,
  permalink text,
  selftext_html text,
  subreddit varchar(255),
  subreddit_id varchar(100),
  thread_id varchar(100) PRIMARY KEY,
  title text`;

  // mentions
  // model varchar(255) NOT NULL,
  // create_date date,
  // url text,
  // subreddit text,
  // subreddit varchar(255),

const commentsSchema = `
  author varchar(100),
  body_html text,
  comment_id varchar(100),
  created_utc timestamp,
  link_title text,
  name varchar(100),
  subreddit varchar(255),
  subreddit_id varchar(100),
  thread_id varchar(100)`;

function prepare(cb) {
  if (db) {
    cb();
  } else {
    prepCallbacks.push(cb);
  }
}

(function() {
  let pg = require('../db');
  async.series([
    (scb) => { pg.query(`CREATE TABLE IF NOT EXISTS threads (${threadsSchema});`, scb); },
    (scb) => { pg.query(`CREATE TABLE IF NOT EXISTS threads_tmp (${threadsSchema});`, scb); },
    (scb) => { pg.query(`CREATE TABLE IF NOT EXISTS comments (${commentsSchema});`, scb); },
    (scb) => { pg.query(`CREATE TABLE IF NOT EXISTS comments_tmp (${commentsSchema});`, scb); }
  ], () => {
    db = pg;
    async.each(prepCallbacks, (prepCallback, eachCB) => {
      prepCallback();
      eachCB();
    }, () => {
      prepCallbacks = [];
    });
  });
})();

exports.getThreads = function(cb) {
  prepare(() => {
    let sql = format('SELECT * FROM threads_tmp;');
    console.log(sql);
    db.query(sql, (err, result) => {
      if (err) return cb(err);
      cb(null, result);
    });
  });
};

exports.saveThreads = function(threads, cb) {
  prepare(() => {
    let sql = format('INSERT INTO threads_tmp VALUES %L ON CONFLICT (thread_id) DO NOTHING;', threads);
    // console.log(sql);
    db.query(sql, (err) => {
      if (err) return cb(err);
      cb();
    });
  });
};

exports.saveComments = function(comments, cb) {
  prepare(() => {
    let sql = format('INSERT INTO comments_tmp VALUES %L;', comments);
    // console.log(sql);
    db.query(sql, (err) => {
      if (err) return cb(err);
      cb();
    });
  });
};

exports.mostRecentThread = function(cb) {
  prepare(() => {
//     WITH T AS (
//     SELECT *, ROW_NUMBER() OVER(PARTITION BY thread_id ORDER BY created_utc DESC) AS rn
//     FROM threads_tmp
// )
// SELECT * FROM T WHERE rn = 1;
    let sql = 'select * from threads_tmp order by created_utc desc limit 1;';
    // console.log(sql);
    db.query(sql, (err, result) => {
      if (err) return cb(err);
      cb(null, result);
    });
  });
};

