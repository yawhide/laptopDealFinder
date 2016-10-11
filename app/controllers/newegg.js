var express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
  Newegg = mongoose.model('Newegg');
const _ = require('lodash');
const cronConfig = require('../../cron/config.js');
const fs = require('fs');
const path = require('path');

module.exports = function (app) {
  app.use('/newegg', router);
};

router.get('/usa/all', function (req, res, next) {
  Newegg.find(function (err, products) {
    if (err) return next(err);
    res.json(products);
  });
});

router.post('/usa/create', function (req, res, next) {
  if (_.isEmpty(req.body)) {
    console.error('hit newegg usa create with an empty body');
    return res.sendStatus(400);
  }
  let data = _.cloneDeep(req.body);
  let priceHistoryObj = {
    preSalePrice: data.preSalePrice,
    currentPrice: data.currentPrice,
    savingsOnPrice: data.savingsOnPrice,
    noteOnPrice: data.noteOnPrice,
    hasPriceMatch: data.hasPriceMatch,
  };
  data.priceHistory = [priceHistoryObj];
  // data.priceHistory.push(priceHistoryObj);
  delete data.preSalePrice;
  delete data.currentPrice;
  delete data.savingsOnPrice;
  delete data.noteOnPrice;
  delete data.hasPriceMatch;

  Newegg.findOne({ neweggID: data.neweggID }, (err, product) => {
    if (err) {
      console.error(`Failed to findOne newegg product with id: ${data.neweggID}.`, err);
      return next(err);
    }
    if (!product) {
      return Newegg.create(data, (err, product) => {
        console.info(`created a new newegg doc: ${data.neweggID}`);
        res.sendStatus(200);
      });
    }
    product.priceHistory.push(priceHistoryObj);
    product.save((err) => {
      if (err) {
        console.error(`Failed to update newegg product with id: ${data.neweggID}.`, err);
        return next(err);
      }
      console.info(`updated newegg doc: ${data.neweggID}`);
      res.sendStatus(200);
    });
  });
});

router.get('/usa/urllist', function (req, res, next) {
  let filePath = path.resolve(__dirname, `../../cron/${cronConfig.newegg.usa.gamingLaptop.savedFilePath}`);
  fs.readFile(filePath, 'utf8', (err, contents) => {
    if (err) {
      console.error('Failed to read local url list.', err);
      return next(err);
    }
    let urls = contents.split('\n');
    if (urls[urls.length - 1] === '') urls.splice(urls.length - 1);
    res.json(urls);
  });
});

router.get('/usa/:id', function (req, res, next) {
  Newegg.findById(req.params.id, function (err, product) {
    if (err) return next(err);
    // console.log(product)
    res.render('newegg-usa-single', {
      product: product._doc,
    });
  });
});
