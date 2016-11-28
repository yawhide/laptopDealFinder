const _ = require('lodash');
const async = require('async');
const config = require('./config');
const fs = require('fs');
const glob = require('glob');
const mongoose = require('mongoose');
const Nightmare = require('nightmare');
const os = require('os');
const path = require('path');
const qs = require('qs');
const startupConfig = require('../config/config');
const url = require('url');
const util = require('util');

const htmlDownloaderTimeout = 10;
const htmlDownloaderWait = 10;
const htmlDownloaderUrl = `http://localhost:8050/render.html?url=%s&timeout=${htmlDownloaderTimeout}&wait=${htmlDownloaderWait}`;

function getRandomSubarray(arr, size) {
    var shuffled = arr.slice(0), i = arr.length, min = i - size, temp, index;
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
}

function parseNeweggHTML() {
  function parseUrl (url) {
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
  let data = { priceInfo: {} };
  let selectors = {
    // can take strings or functions with cherrio'ed html passed in
    'preSalePrice': '#landingpage-price > div > div > ul > li.price-was',
    'currentPrice': '#landingpage-price > div > div > ul > li.price-current',
    'savingsOnPrice': '#landingpage-price > div > div > ul > li.price-save',
    'noteOnPrice': '#landingpage-price > div > div > ul > li.price-note',
    'hasPriceMatch': function () {
      return !!document.querySelector('#landingpage-iron-egg > div > div.price-guarantee');
    },
    'specialPrice': '#landingpage-price > div > div > ul > li.price-map',
  };
  Object.keys(selectors).forEach(info => {
    if (typeof selectors[info] === 'function') {
      data[info] = selectors[info]();
      return;
    }
    // console.log($)
    // console.log($('#landingpage-price > div > div > ul > li.price-current').text())
    let text = document.querySelector(selectors[info]).innerText;
    data.priceInfo[info] = text === null || text === undefined ? '' : text;
  });

  // get the spec list and programmatically iterate through and get each spec
  let specList = document.querySelectorAll('#Specs > fieldset > dl');
  if (specList) {
    for (let i = 0; i < specList.length; i++) {
      let elem = specList[i];
      let currentSpec = elem.querySelector('dt').innerText;
      if (!currentSpec) continue;
      let info = elem.querySelector('dd').innerText || '';
      data[currentSpec] = info.replace(/<br>/g, '\n');
    }
  }

  // get the images
  let imageElems = document.querySelectorAll('#synopsis > div.grpAside > div > ul > li > a > img');
  data.images = [];
  for (let i = 0; i < imageElems.length; i++) {
    if (imageElems[i].src) {
      data.images.push(imageElems[i].src);
    }
  }
  data.url = window.location.href;
  console.log('before parseUrl');
  let params = parseUrl(data.url);
  console.log('params', params)
  let itemId = params['Item'];
  if (itemId) {
    data.neweggID = itemId;
  } else {
    console.error("cannot get neweggID..." + uri);
    return;
  }
  return data;
}

function writeToMongo(data, cb) {
  let priceInfo = _.cloneDeep(data.priceInfo);
  data.priceHistory = [priceInfo];
  delete data.priceInfo;

  Newegg.findOne({ neweggID: data.neweggID }, (err, product) => {
    if (err) {
      console.error(`Failed to findOne newegg product with id: ${data.neweggID}.`, err);
      return cb(err);
    }
    if (!product) {
      return Newegg.create(data, (err, product) => {
        // console.info(`created a new newegg doc: ${data.neweggID}`);
        cb();
      });
    }
    product.images = data.images;
    product.priceHistory.push(priceInfo);
    product.save((err) => {
      if (err) {
        console.error(`Failed to update newegg product with id: ${data.neweggID}.`, err);
        return cb(err);
      }
      // console.info(`updated newegg doc: ${data.neweggID} with: ${JSON.stringify(priceInfo, null, 3)}`);
      cb();
    });
  });
}

function readSavedUrls(cb) {
  console.time('readSavedUrls');
  fs.readFile(config.newegg.usa.gamingLaptop.savedFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read file at path:', config.newegg.usa.gamingLaptop.savedFilePath, err);
      return cb(err);
    }
    let uris = data.split('\n');
    console.log(uris.length)

    // let nightmares = Array(config.nightmare.numWorkers).fill();
    console.log('we have', config.nightmare.numWorkers, 'workers');
    let urisPerWorker = 10 / config.nightmare.numWorkers;

    async.each(Array.from({ length: config.nightmare.numWorkers }, (v, k) => k), (i, eachCB) => {
      let nightmare = new Nightmare(config.nightmare.settings);

      let arr = uris.slice(urisPerWorker*i,urisPerWorker*(i+1));

      async.eachLimit(arr, 1, (uri, eachLimitCB) => {
        console.time(`${i}: ${uri}`);
        nightmare
          .useragent(config.nightmare.useragent)
          .viewport(400,150)
          .goto(uri)
          .wait('#landingpage-price > div > div > ul > li.price-current')
          .evaluate(function() {
            function parseUrl (url) {
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
            let data = { priceInfo: {} };
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
                data[info] = selectors[info]();
                return;
              }
              // console.log($)
              // console.log($('#landingpage-price > div > div > ul > li.price-current').text())
              let text = document.querySelector(selectors[info]).innerText;
              data.priceInfo[info] = text === null || text === undefined ? '' : text;
            });

            // get the spec list and programmatically iterate through and get each spec
            let specList = document.querySelectorAll('#Specs > fieldset > dl');
            if (specList) {
              for (let i = 0; i < specList.length; i++) {
                let elem = specList[i];
                let currentSpec = elem.querySelector('dt').innerText;
                if (!currentSpec) continue;
                let info = elem.querySelector('dd').innerText || '';
                data[currentSpec] = info.replace(/<br>/g, '\n');
              }
            }

            // get the images
            let imageElems = document.querySelectorAll('#synopsis > div.grpAside > div > ul > li > a > img');
            data.images = [];
            for (let i = 0; i < imageElems.length; i++) {
              if (imageElems[i].src) {
                data.images.push(imageElems[i].src);
              }
            }
            data.url = window.location.href;
            // console.log('before parseUrl');
            let params = parseUrl(data.url);
            // console.log('params', params)
            let itemId = params['Item'];
            if (itemId) {
              data.neweggID = itemId;
            } else {
              console.error("cannot get neweggID..." + uri);
              return;
            }
            return data;
          })
          .then(info => {
            writeToMongo(info, (err) => {
              if (err) return eachLimitCB();
              console.timeEnd(`${i}: ${uri}`);
              eachLimitCB();
            });
          }, (err) => {
            console.error('Failed to get data from uri:', uri, err);
            eachLimitCB();
          });
      }, (err) => {
        nightmare.end().then().catch((err) => { console.error(err); });
        eachCB();
      });
    }, (err) => {
      cb();
    });
  });
};

mongoose.Promise = global.Promise;
mongoose.connect(startupConfig.db);
var db = mongoose.connection;
db.on('error', function () {
  console.error('failed to connect to db:', startupConfig.db);
  throw new Error('unable to connect to database at ' + startupConfig.db);
});

var models = glob.sync(startupConfig.root + '/app/models/*.js');
models.forEach(function (model) {
  require(model);
});

console.info('mongo db ready');

const Newegg = mongoose.model('Newegg');

// readLocalSavedHTML()
readSavedUrls(err => {
  console.log('job\'s done');
  process.exit();
});
