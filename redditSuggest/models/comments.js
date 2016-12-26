const _ = require('lodash');
const db = require('../db.js');
const log = require('better-logs')('model-comments');
const Sequelize = require('sequelize');

const schema = {
  author:       { type: Sequelize.STRING },
  body_html:    { type: Sequelize.TEXT },
  comment_id:   { type: Sequelize.STRING, allowNull: false },
  created_utc:  { type: Sequelize.DATE },
  link_id:      { type: Sequelize.STRING },
  name_id:      { type: Sequelize.STRING },
  subreddit:    { type: Sequelize.STRING },
  subreddit_id: { type: Sequelize.STRING, allowNull: false },
  thread_id:    { type: Sequelize.STRING, allowNull: false },
  urls:         { type: Sequelize.ARRAY(Sequelize.TEXT) },
};

const Comments = db.define('comments', schema, {
// how to create index
/*
indexes: [
    {
      unique: true,
      fields: ['dbname', 'accountId', 'externalId']
    },
  ]
  */
  freezeTableName: true,
  timestamps: true,
  underscored: true,
});

exports.model = Comments;
// exports.sync = Comments.sync();

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

exports.getNonProcessed = function (ids, cb) {
  let options = {
    where: {
      id: {
        $notIn: ids
      }
    }
  };
  if (!_.get(ids, 'length')) {
    options = {};
  }
  Comments.findAll(options)
    .then(rows => {
      log.debug(rows.length);
      cb(null, rows.map(row => row.get({ plain: true })));
    })
    .catch(cb);
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
