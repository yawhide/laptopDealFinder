const _ = require('lodash');
const async = require('async');
const config = require('../config/constants');

const mongoose = require('mongoose');
const Items = mongoose.model('Items');

exports.createItem = function (data, cb) {
  let payload = {
    model: data.model,
    sources: { [data.sourceName]: data.sourceInfo },
    specifications: data.specifications,
  }
  Items.create(payload, cb);
}

exports.getByModel = function(model, cb) {
  console.info(model);
  Items.findOne({ model }, (err, doc) => {
    if (err) return cb(err);
    console.info('found?:', !!doc);
    cb(null, doc);
  });
}

function specDiff(origSpecs, specs) {
  //TODO
}

exports.writeToMongo = function(model, sourceName, data, cb) {
  exports.getByModel(model, (err, doc) => {
    if (err) {
      console.error(`Failed to findOne ${sourceName} doc with model: ${model}.`, err);
      return cb(err);
    }
    if (!doc) {
      return exports.createItem(data, (err) => {
        if (err) {
          console.error(`Failed to create ${sourceName} doc with model: ${model}.`, err);
          return cb(err);
        }
        cb();
      });
    }
    if (!_.get(doc, ['sources', sourceName])) {
      doc.sources[sourceName] = data.sourceInfo;
    } else {
      doc.sources[sourceName].images = data.sourceInfo.images;
      doc.sources[sourceName].priceHistory = doc.sources[sourceName].priceHistory.concat(data.sourceInfo.priceHistory);
    }
    // TODO
    // doc.specifications = specDiff(doc.specifications, data.specifications);
    doc.markModified('sources');
    doc.save(err => {
      if (err) {
        console.error(`Failed to update ${sourceName} doc with model: ${model}.`, err);
        return cb(err);
      }
      cb();
    });
  });
}
