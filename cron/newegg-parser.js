const _ = require('lodash');
const async = require('async');
const cheerio = require('cheerio');
const config = require('./config');
const fs = require('fs');
const jsdom = require('jsdom');
const needle = require('needle');
const path = require('path');
const qs = require('qs');
const url = require('url');
const util = require('util');

const splashDockerIP = fs.readFileSync('splash-docker-ip.txt', 'utf8').trim();
const htmlDownloaderTimeout = 10;
const htmlDownloaderWait = 10;
const htmlDownloaderUrl = `http://localhost:8050/render.html?url=%s&timeout=${htmlDownloaderTimeout}&wait=${htmlDownloaderWait}`;


// ================= helpers ================== //

// returns err, html
function getRequest(uri, cb) {
  needle.get(uri, { open_timeout: 20000 }, (err, resp) => {
    if (_.get(resp, 'statusCode') === 200) {
      cb(null, resp.body);
    } else if (err) {
      cb({ error: err, message: `failed to make request using url: ${uri}` });
    } else {
      cb({ error: resp.statusCode, message: resp.body });
    }
  });
}

// ================= test ===================== //

function readLocalSavedHTML() {
  let folderPath = './html-test/neweggusa';
  fs.readdir(folderPath, (err, dir) => {
    if (err) {
      console.error(`Failed to find local path ${foldPath}.`, err);
      return;
    }
    dir.forEach(filePath => {
      if (filePath.endsWith('.html')) {
        console.log(filePath)
        fs.readFile(path.resolve(folderPath, filePath), 'utf-8', (err, html) => {
          if (err) {
            console.error('Failed to read local html file.', err);
            return;
          }
          let info = parseNeweggHTML(html);
          // // info.url = uri;

          // let urlObj = url.parse(uri);
          // let splittedQueryString = urlObj.query.split('=');
          // let itemIdIndex = splittedQueryString.indexOf('Item');
          // console.log(urlObj, splittedQueryString, itemIdIndex)
          // if (itemIdIndex) {
          //   info.neweggID = splittedQueryString[itemIdIndex + 1];
          // } else {
          //   throw "cannot get neweggID..." + uri;
          // }

          console.log('info:', info);
          process.exit(1);
        });
      }
    });
  });
}

// ================= main ===================== //
/*
  gets the spec names for newegg usa
  let d = document.querySelectorAll('#Specs > fieldset > dl > dt');
  for(let i = 0; i < d.length; i++){ console.log(d[i].innerText) }
*/
function parseNeweggHTML(html) {
  let $ = cheerio.load(html);
  let selectors = {
    // can take strings or functions with cherrio'ed html passed in
    'preSalePrice': '#landingpage-price > div > div > ul > li.price-was',
    'currentPrice': '#landingpage-price > div > div > ul > li.price-current',
    'savingsOnPrice': '#landingpage-price > div > div > ul > li.price-save',
    'noteOnPrice': '#landingpage-price > div > div > ul > li.price-note',
  };
  let data = {};
  Object.keys(selectors).forEach(info => {
    if (typeof selectors[info] === 'function') {
      data[info] = selectors[info]($);
      return;
    }
    // console.log($)
    // console.log($('#landingpage-price > div > div > ul > li.price-current').text())
    data[info] = $(selectors[info]).text();
  });

  // get the spec list and programmatically iterate through and get each spec
  let specList = $('#Specs > fieldset > dl');
  if (specList) {
    let children = specList.children();
    let currentSpec = '';
    for (let i = 0; i < children.length; i++) {
      let child = children[i];
      let initializedChild = $(child);
      if (child.name === 'dt') {
        currentSpec = initializedChild.text();
      } else if (child.name === 'dd') {
        data[currentSpec] = initializedChild.html().replace(/<br>/g, '\n');
      }
    }
  }
  return data;
}

function readSavedUrls(cb) {
  console.time('readSavedUrls');
  console.log('local docker ip:', splashDockerIP);
  fs.readFile(config.newegg.usa.gamingLaptop.savedFilePath, 'utf-8', (err, data) => {
    let uris = data.split('\n');
    async.mapLimit(uris.slice(0, 5)
      , 5, (uri, mapCB) => {
      if (!uri) return mapCB();

      getRequest(util.format(htmlDownloaderUrl, uri), (err, html) => {
        if (err) {
          console.error(err.error, err.message);
          return mapCB();
        }

        fs.writeFileSync('newegg-' + uri.split('Item=')[1] + '.html', html);

        let info = parseNeweggHTML(html);
        info.url = uri;

        let urlObj = url.parse(uri);
        let parsedQS = qs.parse(urlObj.query);
        let id = parsedQS['Item'];
        if (id) {
          info.neweggID = id;
        } else {
          throw "cannot get neweggID..." + uri;
        }
        // console.log(info);
        mapCB(null, info);
      });
    }, (err, infos) => {
      console.timeEnd('readSavedUrls');
      if (err) {
        console.error('Failed to get all website info from newegg.', err);
        return cb(err);
      }
      cb(null, infos);
    });
    console.log(uris.length)
  });
}

// readLocalSavedHTML()
readSavedUrls((err, results) => {
  console.log(results)
  console.log('done')
  process.exit();
});
