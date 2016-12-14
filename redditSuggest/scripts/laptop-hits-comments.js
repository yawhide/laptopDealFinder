const async = require('async');
const fs = require('fs');
const Xray = require('x-ray');

const x = Xray();

const commentLinks = JSON.parse(fs.readFileSync('results.json', 'utf8'));
const prefixLen = 'http://www.laptophits.com/products/'.length

let count = 0;
async.eachLimit(commentLinks, 1, (link, eachCB) => {
  let splitted = link.comments.substring(prefixLen).split('/');
  fs.stat('comments/' + splitted[0] + '.json', (err, stats) => {
    if (stats) {
      count++;
      return eachCB();
    }
    x(link.comments, '.content ul li', [{
      redditUrl: 'a:nth-child(2)@href'
    }])
      .paginate('a.next_page@href')
      .write('comments/' + splitted[0] + '.json');
    setTimeout(function () {
      console.log(count++, '/ 355');
      eachCB();
    }, 10000);
  })
});
