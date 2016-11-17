const _ = require('lodash');
const async = require('async');
const config = require('../config/config');
const constants = require('../config/constants');
const fs = require('fs');
const needle = require('needle');
const Nightmare = require('nightmare');
const path = require('path');
const querystring = require('querystring');
const util = require('util');

const nightmareLib = require('../library/nightmare');

const nightmareLaptopPageWaitSelector = '#landingpage-price > div > div > ul > li.price-current';

const numberOfLaptopsSelector = '#content > table > tbody > tr > td > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > div > form > table:nth-child(8) > tbody > tr > td > table:nth-child(2) > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(2) > td:nth-child(1)';

const anchorTagOnLaptopListSelector = '#content > table > tbody > tr > td > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > div > form > table:nth-child(8) > tbody > tr > td > table:nth-child(3) > tbody > tr > td:nth-child(2) > a';

// superbiiz
// `http://www.superbiiz.com/query.php?s=%20&categry=57&stock=all&dp=${pageNumber}&nl=50&stock=all`

const serviceName = 'superbiiz';

exports.getGamingLaptopUris = function (cb) {
  console.time('created gaming laptop url list for', serviceName);
  let uri = util.format(constants[serviceName].gamingLaptop.paginatedUrl, 1);
  let uris;
  let numLaptops = 0;

  let nightmare = new Nightmare(constants.nightmare.settings);
  nightmare
    .useragent(constants.nightmare.useragent)
    .viewport(400,150)
    .goto(uri)
    .wait(numberOfLaptopsSelector)
    .evaluate(function (selector) {
      let elems = document.querySelectorAll(selector);
      let urls = [];
      for(let i = 0; i < elems.length; i++) {
        urls.push(elems[i].href);
      }
      let totalNumberOfLaptops = document.querySelector('#content > table > tbody > tr > td > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > div > form > table:nth-child(8) > tbody > tr > td > table:nth-child(2) > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(2) > td:nth-child(1)').innerText;
      return { urls, numLaptops: Number(totalNumberOfLaptops.replace(/\D/g, '')) };
    }, anchorTagOnLaptopListSelector)
    .then(function (info) {
      uris = info.urls;
      numLaptops = info.numLaptops;
      console.log(numLaptops, 'laptops available to scrape');
      let pageNumbersArr = Array(Math.ceil(numLaptops/50) - 1).fill().map((i,j)=>j+1);
      console.log('scraping page numbers:', pageNumbersArr);
      async.eachSeries(pageNumbersArr, (pageNumber, eachSeriesCB) => {

        let currUri = util.format(constants[serviceName].gamingLaptop.paginatedUrl, pageNumber);
        nightmare
          .useragent(constants.nightmare.useragent)
          .viewport(400,150)
          .goto(currUri)
          .wait(numberOfLaptopsSelector)
          .evaluate(function (selector) {
            let elems = document.querySelectorAll(selector);
            let urls = [];
            for(let i = 0; i < elems.length; i++) {
              urls.push(elems[i].href);
            }
            return urls;
          }, anchorTagOnLaptopListSelector)
          .then(function (info) {
            uris = uris.concat(info);
            eachSeriesCB();
          });

      }, () => {
        uris = _.uniq(uris);
        fs.writeFileSync(`cron/${constants[serviceName].gamingLaptop.savedFilePath}`, uris.join('\n'));
        console.log('done, wrote', uris.length, 'urls');
        console.timeEnd('created gaming laptop url list for', serviceName);
        cb(null, uris);
      });
    });
}

function nightmareLaptopPageFn(nightmare, uri, cb) {
  nightmare
    .useragent(constants.nightmare.useragent)
    .viewport(400,150)
    .goto(uri)
    .wait(nightmareLaptopPageWaitSelector)
    .evaluate(function() {
      function parseUrl (uri) {
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
          url: '',
        },
        sourceName: 'newegg',
        specifications: {},
      };
      let selectors = {
        // can take strings or functions with cherrio'ed html passed in
        'preSalePrice': '#landingpage-price > div > div > ul > li.price-was', // very new product
        'price': '#landingpage-price > div > div > ul > li.price-current',
        'savingsOnPrice': '#landingpage-price > div > div > ul > li.price-save',
        'noteOnPrice': '#landingpage-price > div > div > ul > li.price-note', // says if its out of stock
        'hasPriceMatch': function () {
          return !!document.querySelector('#landingpage-iron-egg > div > div.price-guarantee');
        },
        'specialPrice': '#landingpage-price > div > div > ul > li.price-map',
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
      let params = parseUrl(data.url);
      // console.log('params', params)
      let itemId = params['Item'];
      if (itemId) {
        data.sourceInfo.id = itemId;
      } else {
        console.error("cannot get neweggID..." + uri);
        return;
      }
      data.model = data.specifications['Model'];
      return data;
    })
    .then(info => {
      console.log(JSON.stringify(info, null, 2))
      cb(null, info);
    }, (err) => {
      console.error('Failed to get data from uri:', uri, err);
      cb();
    });
}

exports.scrape = function (uriList, cb) {
  console.time('scrape');
  nightmareLib.runNightmare(nightmareLaptopPageFn, uriList, (err) => {
    if (err) {
      console.error('running nightmare errored.', err);
    }
    console.timeEnd('scrape');
    cb();
  });
}

exports.scrapeWithFileUrlList = function (cb) {
  fs.readFile(`cron/${constants.newegg.usa.gamingLaptop.savedFilePath}`, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read file at path:', constants.newegg.usa.gamingLaptop.savedFilePath, err);
      return cb(err);
    }
    let uris = data.split('\n');
    exports.scrape(uris, cb);
  });
}
