// this script inserted in all pages

function waitForPriceToLoad(cb) {
  setTimeout(() => {
    if (!!document.querySelector('#landingpage-price > div > div > ul > li.price-current')) {
      return cb();
    }
    waitForPriceToLoad(cb);
  }, 1000);
}

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

function parseNeweggHTML() {
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

chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
  console.log('runtime received message', req.action);
  if (req.action === 'parseInfo') {
    console.log('received parseInfo...executing');
    waitForPriceToLoad(() => {
      console.log('executing parseInfo...');
      let data = parseNeweggHTML();
      console.log('sending...', data);
      sendResponse(data);
    });
    return true;
  }
});

console.log('runtime ready to accept incoming messages');
