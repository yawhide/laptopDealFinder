const _ = require('lodash');
const db = require('../db.js');
const Sequelize = require('sequelize');

const schema = {
  comment_id: { type: Sequelize.INTEGER, allowNull: false },
  processed:  { type: Sequelize.BOOLEAN },
};

const CommentsProcessed = db.define('comments_processed', schema, {
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

exports.model = CommentsProcessed;
exports.sync = CommentsProcessed.sync();

exports.bulkCreate = function(records, cb) {
  if (!_.get(records, 'length')) return cb();
  CommentsProcessed.bulkCreate(records)
    .then(() => {
      cb();
    })
    .catch(cb);
}

exports.create = function(values, cb) {
  CommentsProcessed.create(values)
    .then(() => {
      cb();
    })
    .catch(cb);
}

exports.findAll = function (cb) {
  CommentsProcessed.findAll()
    .then((rows) => {
      cb(null, rows.map(row => row.get({ plain: true })));
    })
    .catch(cb);
}
