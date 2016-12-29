const _ = require('lodash');
const db = require('../db.js');

//TODO
return;
const Sequelize = require('sequelize');

const Threads = db.define('threads', {
  created_utc:   { type: Sequelize.DATE },
  permalink:     { type: Sequelize.TEXT },
  selftext_html: { type: Sequelize.TEXT },
  subreddit:     { type: Sequelize.STRING },
  subreddit_id:  { type: Sequelize.STRING },
  thread_id:     { type: Sequelize.STRING, primaryKey: true },
  title:         { type: Sequelize.STRING },
}, {
  freezeTableName: true,
  timestamps: true,
});

exports.sync = Threads.sync();

exports.bulkCreate = function(records, cb) {
  if (!_.get(records, 'length')) return cb();
  Threads.bulkCreate(records)
    .then(() => {
      cb();
    })
    .catch(cb);
}

exports.create = function(values, cb) {
  Threads.create(values)
    .then(() => {
      cb();
    })
    .catch(cb);
}
