const _ = require('lodash');
const async = require('async');
const config = require('../config/config');
const constants = require('../config/constants');
const fs = require('fs');
const Nightmare = require('nightmare');
const util = require('util');

const nightmareLib = require('../library/nightmare');

const nightmareLaptopPageWaitSelector = '#tMain > div.topWrapper.clearfix.js-item.new-page-width.js-bhItemObj > div.full-width.table > div.top-right.table-cell > div.pPriceZoneRight.fs14.c28.js-priceZone > div.youPay > p > span.ypYouPay.c32.right.fs24.OpenSans-600-normal';

const numberOfLaptopsSelector = 'body > div.t-content > div.t-main.js-t-main.page-width.full-width.clearfix > div.right.main-content.js-main-content > div.page-info.top.full-width.c2 > div.pagination.top > div.top.c1.fs24.clearfix > span';

const anchorTagOnLaptopListSelector = 'body > div.t-content > div.t-main.js-t-main.page-width.full-width.clearfix > div.right.main-content.js-main-content > div.items.full-width.gallery-view.clearfix > div > a.img-link';

// superbiiz
// `http://www.superbiiz.com/query.php?s=%20&categry=57&stock=all&dp=${pageNumber}&nl=50&stock=all`

const serviceName = 'bandh';

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
      let totalNumberOfLaptopsElem = document.querySelector('body > div.t-content > div.t-main.js-t-main.page-width.full-width.clearfix > div.right.main-content.js-main-content > div.page-info.top.full-width.c2 > div.pagination.top > div.top.c1.fs24.clearfix > span').childNodes;
      let totalNumberOfLaptops = totalNumberOfLaptopsElem[totalNumberOfLaptopsElem.length - 1].nodeValue.trim();
      return { urls, numLaptops: Number(totalNumberOfLaptops.replace(/\D/g, '')) };
    }, anchorTagOnLaptopListSelector)
    .then(function(info) {
      uris = info.urls;
      numLaptops = info.numLaptops;
      console.log(numLaptops, 'laptops available to scrape');
      let pageNumbersArr = Array(Math.ceil(numLaptops / 50) - 1).fill().map((i, j) => j + 1);
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
        uris = _.uniq(uris.map(url => url + '&show=p'));
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
        sourceName: 'bandh',
        specifications: {}
      };
      let selectors = {
        // can take strings or functions with cherrio'ed html passed in
        'preSalePrice': '', // very new product
        'price': '#tMain > div.topWrapper.clearfix.js-item.new-page-width.js-bhItemObj > div.full-width.table > div.top-right.table-cell > div.pPriceZoneRight.fs14.c28.js-priceZone > div.youPay > p > span.ypYouPay.c32.right.fs24.OpenSans-600-normal',
        'savingsOnPrice': '',
        'noteOnPrice': '', // says if its out of stock
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
      let specList = document.querySelectorAll('#Specification > div > div.leftPanel > div > table > tbody > tr');
      if (specList) {
        for (let i = 0; i < specList.length; i++) {
          let elem = specList[i];
          let specTopic = elem.querySelector('.specTopic');
          let specDetail = elem.querySelector('.specDetail');

          if (specTopic && specDetail) {
            data.specifications[specTopic.innerText.replace(/&nbsp;/g, '').replace(/\./g, '')] = specDetail.innerText.replace(/<br>/g, '\n').replace(/&nbsp;/g, '');
          }
        }
      }

      // get the images
      let imageElems = document.querySelectorAll('#tMain > div.topWrapper.clearfix.js-item.new-page-width.js-bhItemObj > div.full-width.table > div.left-2-sections.table-cell > div.top-left.js-topLeft.left > div.image-thumbs.js-imageThumbs.js-close > a.cursor-pointer.smImgLink > img');
      for (let i = 0; i < imageElems.length; i++) {
        let elem = imageElems[i].querySelector('img');
        if (elem.src) {
          data.sourceInfo.images.push(elem.src);
        }
      }
      data.sourceInfo.url = window.location.href;

      let itemId = document.querySelector('#tMain > div.topWrapper.clearfix.js-item.new-page-width.js-bhItemObj > div.pProductNameContainer > span > span:nth-child(3)').innerText;
      if (itemId) {
        itemId = itemId.replace(/&nbsp;/g, '').replace(/#/g, '').substring(3).trim();
        data.sourceInfo.id = itemId;
      } else {
        console.error('cannot get neweggID...' + uri);
        return;
      }
      data.model = document.querySelector('#tMain > div.topWrapper.clearfix.js-item.new-page-width.js-bhItemObj > div.pProductNameContainer > span > span.fs16.c28.mfr-number').innerText;
      data.model = data.model.replace(/&nbsp;/g, '').replace(/#/g, '').substirng(3).trim();
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
  fs.readFile(`cron/${constants[serviceName].gamingLaptop.savedFilePath}`, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read file at path:', constants.newegg.usa.gamingLaptop.savedFilePath, err);
      return cb(err);
    }
    let uris = data.split('\n');
    exports.scrape(uris, cb);
  });
};
