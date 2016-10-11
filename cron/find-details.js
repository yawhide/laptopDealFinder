const async = require('async');
const cheerio = require('cheerio');
const _ = require('lodash');
const needle = require('needle');
const util = require('util');

module.exports.findDetails = function (uri, selectors, cb) {
  needle.get(uri, (err, resp) => {
    if (!err && resp.statusCode === 200) {
      let $ = cheerio.load(resp.body);
      let responses = [];
      selectors.forEach(selector => {
        let elem = $(selector);
        if (elem) {
          responses.push(elem);
        }
      });
      cb(null, responses);
    } else {
      console.error(err || resp.statusCode);
      cb(err || resp.statusCode);
    }
  }
}
