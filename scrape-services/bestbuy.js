// bestbuy
// `http://www.bestbuy.com/site/searchpage.jsp?cp=${pageNumber}&searchType=search&_dyncharset=UTF-8&ks=960&sc=Global&list=y&usc=All%20Categories&type=page&id=pcat17071&iht=n&seeAll=&browsedCategory=pcmcat287600050003&st=pcmcat287600050003_categoryid%24abcat0502000&qp=collection_facet%3DSAAS~Collection~Gaming%20Series%5Ecomputergraphicstypesv_facet%3DGraphics%20Type~Discrete`

const _ = require('lodash');
const async = require('async');
const constants = require('../config/constants');
const fs = require('fs');
const Nightmare = require('nightmare');
const util = require('util');

const nightmareLib = require('../library/nightmare');

const nightmareLaptopPageWaitSelector = '#sku-title > h1';

const numberOfLaptopsSelector = '#main-results > div.results-tabs > ul > li > a > span';

const anchorTagOnLaptopListSelector = '#main-results > div.list-items > div > div > div.col-xs-6.list-item-postcard-column > div > div.sku-title > h4 > a';

const specificationDiv = '#specifications-accordion > button';

const specificationInfoSelector = '#specifications-accordion > div > div.specification-group.key-specs';

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
    .click(specificationDiv)
    .wait(specificationInfoSelector)
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
      let isAvailableElem = document.querySelector('#pdp-inactive-content > div.alert.alert-warning');
      if (isAvailableElem && isAvailableElem.innerText === 'This item is no longer available.') return { error: 'no longer available' };

      let data = {
        model: '',
        sourceInfo: {
          country: 'usa',
          id: '',
          images: [],
          priceHistory: [{}],
          url: ''
        },
        sourceName: 'bestbuy',
        specifications: {}
      };
      let selectors = {
        // can take strings or functions with cherrio'ed html passed in
        'preSalePrice': '#priceblock-wrapper-wrapper > div.price-block.priceblock-large > div.pucks-and-price.row > div.col-xs-7 > div.price-column > div.details > span.regular-price', // very new product
        'price': '#priceblock-wrapper-wrapper > div.price-block.priceblock-large > div.pucks-and-price.row > div.col-xs-7 > div.price-column > div.item-price',
        'savingsOnPrice': '#priceblock-wrapper-wrapper > div.price-block.priceblock-large > div.pucks-and-price.row > div.col-xs-7 > div.price-column > div.details > span.savings-amount',
        'noteOnPrice': '#priceblock-wrapper-wrapper > div.price-block.priceblock-large > div.pucks-and-price.row > div.col-xs-12 > div > a > span', // says if its out of stock
        'hasPriceMatch': function() {
          return Boolean(document.querySelector('#priceblock-wrapper-wrapper > div.price-block.priceblock-large > div.pucks-and-price.row > div.col-xs-12 > div.low-price-wrapper > a'));
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
      let specList = document.querySelectorAll('#specifications-accordion > div > div > ul > li');
      if (specList) {
        for (let i = 0; i < specList.length; i++) {
          let elem = specList[i];
          let specNameElem = elem.querySelector('div.specification-name');
          if (specNameElem && specNameElem.querySelector('a')) {
            specNameElem = specNameElem.querySelector('a');
          }
          let specValueElem = elem.querySelector('div.specification-value');
          if (specNameElem && specValueElem) {
            let specName = specNameElem.innerText;
            let specValue = specValueElem.innerText;
            data.specifications[specName.replace(/&nbsp;/g, '').replace(/\./g, '')] = specValue.replace(/<br>/g, '\n');
          }
        }
      }

      // get the images
      let imageElems = document.querySelectorAll('#carousel-main > div > div.indicators-row > div.indicators-column.images-indicators > div.indicators-outter > ol > li.thumbnail-image-wrapper > span > img');
      for (let i = 0; i < imageElems.length; i++) {
        let elem = imageElems[i];
        if (elem.src) {
          data.sourceInfo.images.push(elem.src);
        }
      }
      data.sourceInfo.url = window.location.href;
      // console.log('before parseUrl');
      let params = parseUrl();
      // console.log('params', params)
      let itemId = params['skuId'];
      if (itemId) {
        data.sourceInfo.id = itemId;
      } else {
        console.error('cannot get bestbuy id...' + data.sourceInfo.url);
        return;
      }
      data.model = data.specifications['Model Number'];
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
  fs.readFile(`cron/${constants.bestbuy.gamingLaptop.savedFilePath}`, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read file at path:', constants.newegg.usa.gamingLaptop.savedFilePath, err);
      return cb(err);
    }
    let uris = data.split('\n');
    exports.scrape(uris, cb);
  });
};
