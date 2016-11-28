var express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
  Newegg = mongoose.model('Newegg');

const _ = require('lodash');
const constants = require('../../config/constants.js');
const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = function(app) {
  app.use('/choose', router);
};

router.get('/', function(req, res, next) {

  res.render('choose', {});
});
