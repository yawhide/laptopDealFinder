const _ = require('lodash');
const Comments = require('./comments');
const db = require('../db.js');
const Sequelize = require('sequelize');

const Laptops = db.define('laptops', {
  amazon_url:         { type: Sequelize.STRING },
  newegg_url:         { type: Sequelize.STRING },
  price:              { type: Sequelize.NUMBER },
  // make sure we use a global name for these fields, like intel i5 or 8gb so we get groups laptops more easily
  brand:              { type: Sequelize.STRING },
  operating_system:   { type: Sequelize.STRING },
  display_size:       { type: Sequelize.STRING }, // has decimals dd.d"
  display_resolution: { type: Sequelize.STRING }, // ddddXdddd
  ram:                { type: Sequelize.NUMBER }, // dd gb
  cpu:                { type: Sequelize.STRING }, // intel core i5
}, {
  freezeTableName: true,
  timestamps: true,
});

Laptops.hasMany(Comments);

exports.sync = Laptops.sync();

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
