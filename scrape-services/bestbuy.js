// bestbuy
// `http://www.bestbuy.com/site/searchpage.jsp?cp=${pageNumber}&searchType=search&_dyncharset=UTF-8&ks=960&sc=Global&list=y&usc=All%20Categories&type=page&id=pcat17071&iht=n&seeAll=&browsedCategory=pcmcat287600050003&st=pcmcat287600050003_categoryid%24abcat0502000&qp=collection_facet%3DSAAS~Collection~Gaming%20Series%5Ecomputergraphicstypesv_facet%3DGraphics%20Type~Discrete`

const _ = require('lodash');
const async = require('async');
const constants = require('../config/constants');
const fs = require('fs');
const Nightmare = require('nightmare');
const util = require('util');

const nightmareLib = require('../library/nightmare');

const nightmareLaptopPageWaitSelector = '#content > table > tbody > tr > td > div > table:nth-child(7) > tbody > tr:nth-child(2) > td:nth-child(2) > table:nth-child(1) > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(1) > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(1) > div > div:nth-child(2) > div > table > tbody > tr > td:nth-child(2) > strong > font';

const numberOfLaptopsSelector = '#main-results > div.results-tabs > ul > li > a > span';

const anchorTagOnLaptopListSelector = '#main-results > div.list-items > div > div > div.col-xs-6.list-item-postcard-column > div > div.sku-title > h4 > a';

// superbiiz
// `http://www.superbiiz.com/query.php?s=%20&categry=57&stock=all&dp=${pageNumber}&nl=50&stock=all`

const serviceName = 'bestbuy';

exports.getGamingLaptopUris = function(cb) {
  console.time('created gaming laptop url list for', serviceName);
  let uri = util.format(constants[serviceName].gamingLaptop.paginatedUrl, 1);
  let uris;
  let numLaptops = 0;

  let nightmare = new Nightmare(constants.nightmare.settings);
  nightmare
    .useragent(constants.nightmare.useragent)
    .viewport(400, 150)
    .goto(uri)
    .wait(numberOfLaptopsSelector)
    .evaluate(function(selector) {
      let elems = document.querySelectorAll(selector);
      let urls = [];
      for (let i = 0; i < elems.length; i++) {
        urls.push(elems[i].href);
      }
      let totalNumberOfLaptops = document.querySelector('#main-results > div.results-tabs > ul > li > a > span').innerText;
      return { urls, numLaptops: Number(totalNumberOfLaptops.replace(/\D/g, '')) };
    }, anchorTagOnLaptopListSelector)
    .then(function(info) {
      uris = info.urls;
      numLaptops = info.numLaptops;
      console.log(numLaptops, 'laptops available to scrape');
      let pageNumbersArr = Array(Math.ceil(numLaptops / 24)).fill().map((i, j) => j + 1).slice(1);
      console.log('scraping page numbers:', pageNumbersArr);
      async.eachSeries(pageNumbersArr, (pageNumber, eachSeriesCB) => {
        let currUri = util.format(constants[serviceName].gamingLaptop.paginatedUrl, pageNumber);
        nightmare
          .useragent(constants.nightmare.useragent)
          .viewport(400, 150)
          .goto(currUri)
          .wait(numberOfLaptopsSelector)
          .evaluate(function(selector) {
            let elems = document.querySelectorAll(selector);
            let urls = [];
            for (let i = 0; i < elems.length; i++) {
              urls.push(elems[i].href);
            }
            return urls;
          }, anchorTagOnLaptopListSelector)
          .then(function(result) {
            uris = uris.concat(result);
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
};

function nightmareLaptopPageFn(nightmare, uri, cb) {
  nightmare
    .useragent(constants.nightmare.useragent)
    .viewport(1400, 1150)
    .goto(uri)
    .wait(nightmareLaptopPageWaitSelector)
    .evaluate(function() {
      function parseUrl(uri) {
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
        sourceName: 'superbiiz',
        specifications: {}
      };
      let selectors = {
        // can take strings or functions with cherrio'ed html passed in
        'preSalePrice': '#content > table > tbody > tr > td > div > table:nth-child(7) > tbody > tr:nth-child(2) > td:nth-child(2) > table:nth-child(1) > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(1) > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(1) > div > div:nth-child(2) > div > table > tbody > tr:nth-child(1) > td:nth-child(2) > strong > font', // very new product
        'price': '#content > table > tbody > tr > td > div > table:nth-child(7) > tbody > tr:nth-child(2) > td:nth-child(2) > table:nth-child(1) > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(1) > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(1) > div > div:nth-child(2) > div > table > tbody > tr > td:nth-child(2) > strong > font',
        'savingsOnPrice': '#content > table > tbody > tr > td > div > table:nth-child(7) > tbody > tr:nth-child(2) > td:nth-child(2) > table:nth-child(1) > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(1) > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(1) > div > div:nth-child(2) > div > table > tbody > tr:nth-child(3) > td:nth-child(2) > font',
        'noteOnPrice': '#content > table > tbody > tr > td > div > table:nth-child(7) > tbody > tr:nth-child(2) > td:nth-child(2) > table:nth-child(1) > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(1) > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(1) > div > div:nth-child(2) > div > b:nth-child(7) > font', // says if its out of stock
        'hasPriceMatch': function() {
          return false;
        },
        'specialPrice': ''
      };
      Object.keys(selectors).forEach(info => {
        if (typeof selectors[info] === 'function') {
          data.sourceInfo.priceHistory[0][info] = selectors[info]();
          return;
        }
        data.sourceInfo.priceHistory[0][info] = '';
        if (!selectors[info]) return;
        let elem = document.querySelector(selectors[info]);
        if (!elem) return;
        let text = elem.innerText;
        data.sourceInfo.priceHistory[0][info] = text === null || text === undefined ? '' : text.trim();
      });

      // get the spec list and programmatically iterate through and get each spec
      let specListSelectors = [
        '#content > table > tbody > tr > td > div > table:nth-child(7) > tbody > tr:nth-child(2) > td:nth-child(2) > table:nth-child(1) > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > div > div > ul:nth-child(1) > ul > li',
        '#content > table > tbody > tr > td > div > table:nth-child(7) > tbody > tr:nth-child(2) > td:nth-child(2) > table:nth-child(1) > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(4) > td > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > div > div > ul:nth-child(1) > ul > li'
      ];
      for (let j = 0; j < specListSelectors.length; j++) {
        let specList = document.querySelectorAll(specListSelectors[j]);
        if (specList && specList.length) {
          for (let i = 0; i < specList.length; i++) {
            let elem = specList[i];
            if (!elem || !elem.innerText) continue;
            let specs = elem.innerText.split(':');
            if (!specs.length) continue;
            if (specs.length === 1) {
              data.specifications[specs[0]] = '';
              continue;
            }
            data.specifications[specs[0]] = specs[1].replace(/<br>/g, '\n').trim();
          }
          break;
        }
      }

      // get the images
      let imageElems = document.querySelectorAll('#content > table > tbody > tr > td > div > table:nth-child(7) > tbody > tr:nth-child(2) > td:nth-child(2) > table:nth-child(1) > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(1) > td:nth-child(1) > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td');
      for (let i = 0; i < imageElems.length; i++) {
        let elem = imageElems[i].querySelector('img');
        if (elem.src) {
          data.sourceInfo.images.push(elem.src);
        }
      }
      data.sourceInfo.url = window.location.href;
      // console.log('before parseUrl');
      let params = parseUrl(data.url);
      // console.log('params', params)
      let itemId = params['name'];
      if (itemId) {
        data.sourceInfo.id = itemId;
      } else {
        console.error('cannot get neweggID...' + uri);
        return;
      }
      data.model = data.specifications['Mfr Part Number'];
      return data;
    })
    .then(info => {
      // console.log(JSON.stringify(info, null, 2));
      cb(null, info);
    }, (err) => {
      console.error('Failed to get data from uri:', uri, err);
      cb(err);
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
  fs.readFile(`cron/${constants.superbiiz.gamingLaptop.savedFilePath}`, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read file at path:', constants.newegg.usa.gamingLaptop.savedFilePath, err);
      return cb(err);
    }
    let uris = data.split('\n');
    exports.scrape(uris, cb);
  });
};
