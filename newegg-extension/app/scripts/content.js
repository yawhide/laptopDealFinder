// this script inserted in all pages

function waitForPriceToLoad(cb) {
  setTimeout(() => {
    if (!!document.querySelector('#landingpage-price > div > div > ul > li.price-current')) {
      console.info('found the price...lets continue!');
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
    'specialPrice': '#landingpage-price > div > div > ul > li.price-map',
    'notAvailable': function() {
      let elem = document.querySelector('#version_promo > h2');
      if (elem && elem.innerText.toLowerCase().indexOf('not available') > -1) return true;
      return false;
    },
    'outOfStock': function() {
      let elem = document.querySelector('#landingpage-stock > strong > span');
      if (elem && elem.innerText.toLowerCase().indexOf('out of stock') > -1) return true;
      return false;
    }
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
