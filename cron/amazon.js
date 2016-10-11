/*
  we have to use a chrome extension to get amazon stuff
*/

// const async = require('async');
// const cheerio = require('cheerio');
// const config = require('./config');
// const fs = require('fs');
// const _ = require('lodash');
// const needle = require('needle');
// const querystring = require('querystring');
// const util = require('util');


// let neweggPagesArray = [];

// function getUriFromNeweggUsa(pageNumber, cb) {
//   let url = util.format(config.amazon.usa.gamingLaptop.paginatedUrl, pageNumber);
//   console.log(url)
//   needle.get(url, (err, resp) => {
//     if (!err && resp.statusCode === 200) {
//       let $ = cheerio.load(resp.body);
//       fs.writeFile('testamazon.html', resp.body);
//       if (pageNumber === 1) {
//         let paginationElem = $('#s-result-count');
//         if (paginationElem && paginationElem.html()) {
//           console.log(paginationElem, paginationElem.html())
//           let splitOnPagesText = paginationElem.html().split(' ');
//           console.log(splitOnPagesText)
//           // neweggPagesArray = splitOnPagesText.length > 0 ? Array(parseInt(splitOnPagesText[1])).fill().map((x,i)=>i+2) : null;

//           // console.log(neweggPagesArray, parseInt(splitOnPagesText[1]))
//         }
//       }

//       let elements = $('#result_30 > div > div:nth-child(3) > div:nth-child(1) > a');
//       let uris = [];
//       Object.keys(elements).forEach(key => {
//         let url = _.get(elements, [key, 'attribs', 'href']);
//         if (url) {
//           let splitOnSlash = url.toLowerCase().split('/');
//           if (splitOnSlash.length > 0) {
//             let i = 1;
//             for (; i < splitOnSlash.length; i++) {
//               if (splitOnSlash[i-1] === 'dp') {
//                 break;
//               }
//             }
//             uris.push(splitOnSlash[i]);
//           }
//         }
//       });
//       cb(null, uris);

//     } else {
//       console.error('Error.', err, _.get(resp, 'statusCode'));
//       cb(err);
//     }
//   });
// }

// getUriFromNeweggUsa(1, (err, uris) => {
//   if (neweggPagesArray.length) {
//     async.mapLimit(neweggPagesArray.slice(1), 5, (i, mapCB) => {
//       getUriFromNeweggUsa(i, mapCB);
//     }, (err, restOfUris) => {
//       let allUris = uris.concat(restOfUris.reduce((a,b)=>a.concat(b)));
//       console.log('done')
//       // console.log(JSON.stringify(allUris, null, 3));
//       fs.writeFile('amazonUSAGamingLaptopUris.txt', allUris.join('\n'));
//     });
//   }
// });


