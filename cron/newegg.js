const async = require('async');
const cheerio = require('cheerio');
const config = require('./config');
const fs = require('fs');
const _ = require('lodash');
const needle = require('needle');
const querystring = require('querystring');
const util = require('util');


let neweggPagesArray = [];

function getUriFromNeweggUsa(pageNumber, cb) {
  let url = util.format(config.newegg.usa.gamingLaptop.paginatedUrl, pageNumber);
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
      cb(null, uris);
    } else {
      console.error(`failed to get page: ${pageNumber}, url: ${url}.`, err);
      cb(err);
    }
  });
}

console.time('creating url list');
getUriFromNeweggUsa(1, (err, uris) => {
  if (neweggPagesArray.length) {
    async.mapLimit(neweggPagesArray.slice(1), 5, (i, mapCB) => {
      getUriFromNeweggUsa(i, mapCB);
    }, (err, restOfUris) => {
      let allUris = uris.concat(restOfUris.reduce((a,b)=>a.concat(b)));
      // console.log(JSON.stringify(allUris, null, 3));
      fs.writeFileSync(config.newegg.usa.gamingLaptop.savedFilePath, allUris.join('\n'));
      console.log('done, wrote', allUris.length, 'urls');
      console.timeEnd('creating url list');
    });
  }
});

// bestbuy
// `http://www.bestbuy.com/site/searchpage.jsp?cp=${pageNumber}&searchType=search&_dyncharset=UTF-8&ks=960&sc=Global&list=y&usc=All%20Categories&type=page&id=pcat17071&iht=n&seeAll=&browsedCategory=pcmcat287600050003&st=pcmcat287600050003_categoryid%24abcat0502000&qp=collection_facet%3DSAAS~Collection~Gaming%20Series%5Ecomputergraphicstypesv_facet%3DGraphics%20Type~Discrete`

// b&h
// `https://www.bhphotovideo.com/c/buy/gaming-notebooks/ipp/100/ci/24610/pn/${pageNumber}/N/3670569600/view/GALLERY`

// superbiiz
// `http://www.superbiiz.com/query.php?s=%20&categry=57&stock=all&dp=${pageNumber}&nl=50&stock=all`

// ncix usa
// http://www.ncixus.com/products/?minorcatid=1323

// adorama
// `http://www.adorama.com/l/Computers/Notebooks-and-Accessories/Notebooks?Page=${pageNumber}`
