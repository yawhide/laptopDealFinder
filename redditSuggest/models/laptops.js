const _ = require('lodash');
const Comments = require('./comments');
const db = require('../db.js');
const log = require('better-logs')('model-laptops');
const Sequelize = require('sequelize');

const schema = {
  url:                { type: Sequelize.STRING, unique: 'laptops_id' },
  store_id:           { type: Sequelize.STRING, unique: 'laptops_id' },
  title:              { type: Sequelize.STRING, unique: 'laptops_id' },
  store:              { type: Sequelize.STRING },

  price:              { type: Sequelize.INTEGER },
  // make sure we use a global name for these fields, like intel i5 or 8gb so we get groups laptops more easily
  brand:              { type: Sequelize.STRING },
  operating_system:   { type: Sequelize.STRING },
  display_size:       { type: Sequelize.STRING }, // has decimals dd.d"
  display_resolution: { type: Sequelize.STRING }, // ddddXdddd
  ram:                { type: Sequelize.INTEGER }, // dd gb
  cpu:                { type: Sequelize.STRING }, // intel core i5
};

const Laptops = db.define('laptops', schema, {
  freezeTableName: true,
  timestamps: true,
  underscored: true,
});

Laptops.hasMany(Comments.model, { as: 'mentions' });
Comments.model.belongsTo(Laptops);

exports.model = Laptops;
exports.sync = Comments.model.sync().then(() => Laptops.sync());

exports.bulkCreate = function(records, cb) {
  if (!_.get(records, 'length')) return cb();
  Laptops.bulkCreate(records)
    .then(() => {
      cb();
    })
    .catch(cb);
}

exports.create = function(values, cb) {
  Laptops.create(values)
    .then(() => {
      cb();
    })
    .catch(cb);
}

exports.findAll = function (cb) {
  Laptops.findAll()
    .then((rows) => {
      cb(null, rows.map(row => row.get({ plain: true })));
    })
    .catch(cb);
}

exports.getByCommentId = function (commentId, cb) {
  Laptops.findOne({
    attributes: ['mentions'],
    where: {
      mentions: commentId
    },
    include: [{
      model: Comments.model,
      // attributes: ['']
    }]
  })
    .then((rows) => {
      log.debug(rows)
      cb(null, rows.map(row => row.get({ plain: true })));
    })
    .catch(cb);
}
