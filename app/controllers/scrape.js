const _ = require('lodash');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const mongoose = require('mongoose');
const Items = mongoose.model('Items');
const os = require('os');
const path = require('path');

module.exports = function (app) {
  app.use('/scrape', router);
};

router.get('/start/:service', function (req, res, next) {
  let scraper;
  console.log(path.resolve(__dirname + `/../../scrape-services/${req.params.service}`))
  try {
    scraper = require(path.resolve(__dirname + `/../../scrape-services/${req.params.service}`));
  } catch(e) {
    return res.sendStatus(404);
  }
  scraper.scrapeWithFileUrlList(err => {
    res.sendStatus(200);
  });
});
