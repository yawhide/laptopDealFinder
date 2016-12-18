const _ = require('lodash');
const db = require('../db.js');
const Sequelize = require('sequelize');

const Comments = db.define('comments', {
  author:       { type: Sequelize.STRING },
  body_html:    { type: Sequelize.TEXT },
  comment_id:   { type: Sequelize.STRING },
  created_utc:  { type: Sequelize.DATE },
  link_id:      { type: Sequelize.STRING },
  name_id:      { type: Sequelize.STRING },
  subreddit:    { type: Sequelize.STRING },
  subreddit_id: { type: Sequelize.STRING },
  thread_id:    { type: Sequelize.STRING },
}, {
  freezeTableName: true,
  timestamps: true,
});

exports.sync = Comments.sync();

exports.bulkCreate = function(records, cb) {
  if (!_.get(records, 'length')) return cb();
  Comments.bulkCreate(records)
    .then(() => {
      cb();
    })
    .catch(cb);
}

exports.create = function(values, cb) {
  Comments.create(values)
    .then(() => {
      cb();
    })
    .catch(cb);
}

exports.findAll = function (cb) {
  Comments.findAll()
    .then((rows) => {
      cb(null, rows.map(row => row.get({ plain: true })));
    })
    .catch(cb);
}
