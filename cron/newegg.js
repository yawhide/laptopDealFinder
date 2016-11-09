const async = require('async');
const cheerio = require('cheerio');
const config = require('./config');
const fs = require('fs');
const _ = require('lodash');
const needle = require('needle');
const querystring = require('querystring');
const util = require('util');


let neweggPagesArray = [];

function getUriFromNeweggUsa(pageNumber, cb) {
  let url = util.format(config.newegg.usa.gamingLaptop.paginatedUrl, pageNumber);
  needle.get(url, (err, resp) => {
    if (!err && resp.statusCode === 200) {
      let $ = cheerio.load(resp.body);

      if (pageNumber === 1) {
        let paginationElem = $('#bodyArea > section > div > div > div.row-body > div > div > div.row.has-side-banner > div.row-body > div.row-body-inner > div.list-wrap > div:nth-child(1) > div.list-tool-pagination > span:nth-child(2) > strong');
        if (paginationElem && paginationElem.html()) {
          // console.log(paginationElem, paginationElem.html())
          let splitOnPagesText = paginationElem.html().split('/');
          neweggPagesArray = splitOnPagesText.length > 0 ? Array(parseInt(splitOnPagesText[1])).fill().map((x,i)=>i+2) : null;
          // console.log(neweggPagesArray, parseInt(splitOnPagesText[1]))
        }
      }

      let elements = $('#bodyArea > section > div > div > div.row-body > div > div > div.row.has-side-banner > div.row-body > div.row-body-inner > div.list-wrap > div:nth-child(4) > div > a');
      let uris = [];
      Object.keys(elements).forEach(key => {
        let url = _.get(elements, [key, 'attribs', 'href']);
        if (url) {
          uris.push(url);
        }
      });
      cb(null, uris);
    } else {
      console.error(`failed to get page: ${pageNumber}, url: ${url}.`, err);
      cb(err);
    }
  });
}

getUriFromNeweggUsa(1, (err, uris) => {
  if (neweggPagesArray.length) {
    async.mapLimit(neweggPagesArray.slice(1), 5, (i, mapCB) => {
      getUriFromNeweggUsa(i, mapCB);
    }, (err, restOfUris) => {
      let allUris = uris.concat(restOfUris.reduce((a,b)=>a.concat(b)));
      // console.log(JSON.stringify(allUris, null, 3));
      fs.writeFile(config.newegg.usa.gamingLaptop.savedFilePath, allUris.join('\n'));
      console.log('done, wrote', allUris.length, 'urls');
    });
  }
});
