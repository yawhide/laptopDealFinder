

// ncix usa
// http://www.ncixus.com/products/?minorcatid=1323

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
