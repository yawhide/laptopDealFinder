const _ = require('lodash');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const mongoose = require('mongoose');
const Items = mongoose.model('Items');
const os = require('os');
const path = require('path');

const serviceMapping = require('../../library/scrape-services');

module.exports = function(app) {
  app.use('/scrape', router);
};

router.get('/create-url-list/:service', function(req, res, next) {
  let scraper = serviceMapping[req.params.service];
  console.log(req.params.service);
  if (!scraper) return res.sendStatus(404);
  scraper.getGamingLaptopUris((err, uris) => {
    if (err) return res.json(err);
    res.json(uris);
  });
});

router.get('/start/:service', function(req, res, next) {
  let scraper = serviceMapping[req.params.service];
  if (!scraper) return res.sendStatus(404);
  scraper.scrapeWithFileUrlList(err => {
    if (err) return res.json(err);
    res.sendStatus(200);
  });
});
