const _ = require('lodash');
const async = require('async');
const Comments = require('./comments');
const Threads = require('./threads');
const log = require('better-logs')('reddit-model');


  // mentions
  // model varchar(255) NOT NULL,
  // create_date date,
  // url text,
  // subreddit text,
  // subreddit varchar(255),

  // laptops
  // model varchar(255) NOT NULL,
  // mentions integer DEFAULT 1,
  // price numeric(10, 2),
  // url text,
  // brand varchar(100),
  // release_date date,
  // screen_size varchar(10),


// let prepCallbacks = [];
// let ready = false;
// function prepare(cb) {
//   if (ready) {
//     cb();
//   } else {
//     prepCallbacks.push(cb);
//   }
// }

// (function() {
//   Promise.all([Comments.sync, Threads.sync])
//     .then(() => {
//       ready = true;
//       async.each(prepCallbacks, (prepCallback, eachCB) => {
//         prepCallback();
//         eachCB();
//       }, () => {
//         prepCallbacks = [];
//       });
//     });
// })();

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
