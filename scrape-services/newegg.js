const _ = require('lodash');
const async = require('async');
const cheerio = require('cheerio');
const constants = require('../config/constants');
const fs = require('fs');
const needle = require('needle');
const path = require('path');
const querystring = require('querystring');
const util = require('util');

const nightmareLib = require('../library/nightmare');

const nightmareLaptopPageWaitSelector = '#landingpage-price > div > div > ul > li.price-current';

function getUriFromNeweggUsa(pageNumber, cb) {
  let neweggPagesArray = [];
  let url = util.format(constants.newegg.usa.gamingLaptop.paginatedUrl, pageNumber);
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
      cb(null, uris, neweggPagesArray);
    } else {
      console.error(`failed to get page: ${pageNumber}, url: ${url}.`, err);
      cb(err);
    }
  });
}

exports.getGamingLaptopUris = function (cb) {
  console.time('created gaming laptop url list');
  getUriFromNeweggUsa(1, (err, uris, neweggPagesArray) => {
    if (neweggPagesArray.length) {
      async.mapLimit(neweggPagesArray.slice(1), 5, (pageNumber, mapCB) => {
        getUriFromNeweggUsa(pageNumber, mapCB);
      }, (err, restOfUris) => {
        let allUris = _.uniq(uris.concat(restOfUris.reduce((a,b)=>a.concat(b))));
        // console.log(JSON.stringify(allUris, null, 3));
        fs.writeFileSync(`cron/${constants.newegg.usa.gamingLaptop.savedFilePath}`, allUris.join('\n'));
        console.log('done, wrote', allUris.length, 'urls');
        console.timeEnd('created gaming laptop url list');
        cb(null, allUris);
      });
    } else {
      cb('failed');
    }
  });
}

// b&h
// `https://www.bhphotovideo.com/c/buy/gaming-notebooks/ipp/100/ci/24610/pn/${pageNumber}/N/3670569600/view/GALLERY`

// adorama
// `http://www.adorama.com/l/Computers/Notebooks-and-Accessories/Notebooks?Page=${pageNumber}`

function nightmareLaptopPageFn(nightmare, uri, cb) {
  nightmare
    .useragent(constants.nightmare.useragent)
    .viewport(400, 150)
    .goto(uri)
    .wait(nightmareLaptopPageWaitSelector)
    .evaluate(function() {
      function parseUrl() {
        let query = window.location.search;
        let regex = /[?&;](.+?)=([^&;]+)/g;
        let match;

        let params = {};

        if (query) {
          while (match = regex.exec(query)) {
            params[match[1]] = decodeURIComponent(match[2]);
          }
        }
        return params;
      }
      // return document.querySelector('#landingpage-price > div > div > ul > li.price-current').innerText;
      let data = {
        model: '',
        sourceInfo: {
          country: 'usa',
          id: '',
          images: [],
          priceHistory: [{}],
          url: ''
        },
        sourceName: 'newegg',
        specifications: {}
      };
      let selectors = {
        // can take strings or functions with cherrio'ed html passed in
        'preSalePrice': '#landingpage-price > div > div > ul > li.price-was', // very new product
        'price': '#landingpage-price > div > div > ul > li.price-current',
        'savingsOnPrice': '#landingpage-price > div > div > ul > li.price-save',
        'noteOnPrice': '#landingpage-price > div > div > ul > li.price-note', // says if its out of stock
        'hasPriceMatch': function() {
          return !!document.querySelector('#landingpage-iron-egg > div > div.price-guarantee');
        },
        'specialPrice': '#landingpage-price > div > div > ul > li.price-map'
      };
      Object.keys(selectors).forEach(info => {
        if (typeof selectors[info] === 'function') {
          data.sourceInfo.priceHistory[0][info] = selectors[info]();
          return;
        }
        // console.log($)
        // console.log($('#landingpage-price > div > div > ul > li.price-current').text())
        let text = document.querySelector(selectors[info]).innerText;
        data.sourceInfo.priceHistory[0][info] = text === null || text === undefined ? '' : text;
      });

      // get the spec list and programmatically iterate through and get each spec
      let specList = document.querySelectorAll('#Specs > fieldset > dl');
      if (specList) {
        for (let i = 0; i < specList.length; i++) {
          let elem = specList[i];
          let currentSpec = elem.querySelector('dt').innerText;
          if (!currentSpec) continue;
          let info = elem.querySelector('dd').innerText || '';
          data.specifications[currentSpec] = info.replace(/<br>/g, '\n');
        }
      }

      // get the images
      let imageElems = document.querySelectorAll('#synopsis > div.grpAside > div > ul > li > a > img');
      for (let i = 0; i < imageElems.length; i++) {
        if (imageElems[i].src) {
          data.sourceInfo.images.push(imageElems[i].src);
        }
      }
      data.sourceInfo.url = window.location.href;
      // console.log('before parseUrl');
      let params = parseUrl();
      // console.log('params', params)
      let itemId = params['Item'];
      if (itemId) {
        data.sourceInfo.id = itemId;
      } else {
        console.error('cannot get neweggID...' + uri);
        return;
      }
      data.model = data.specifications['Model'];
      return data;
    })
    .then(info => {
      console.log(JSON.stringify(info, null, 2));
      cb(null, info);
    }, (err) => {
      console.error('Failed to get data from uri:', uri, err);
      cb();
    });
}

exports.scrape = function(uriList, cb) {
  console.time('scrape');
  nightmareLib.runNightmare(nightmareLaptopPageFn, uriList, (err) => {
    if (err) {
      console.error('running nightmare errored.', err);
    }
    console.timeEnd('scrape');
    cb();
  });
};

exports.scrapeWithFileUrlList = function(cb) {
  fs.readFile(`cron/${constants.newegg.usa.gamingLaptop.savedFilePath}`, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read file at path:', constants.newegg.usa.gamingLaptop.savedFilePath, err);
      return cb(err);
    }
    let uris = data.split('\n');
    exports.scrape(uris, cb);
  });
};
