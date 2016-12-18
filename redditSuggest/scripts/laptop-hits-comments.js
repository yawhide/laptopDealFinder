const async = require('async');
const fs = require('fs');
const log = require('better-logs')('laptop-hits-comments-stage-2');
const Xray = require('x-ray');

const x = Xray();

const stage1FilePath = 'scripts/laptop-hits-stage-1.json';

const commentLinks = JSON.parse(fs.readFileSync(stage1FilePath, 'utf8'));
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
      redditUrl: 'a:nth-child(2)@href',
    }])
      .paginate('a.next_page@href')
      // .delay(5000,10000)
      // .write('comments/' + splitted[0] + '.json')
      (function(err, obj) {
        // log.debug(err, obj, obj.length)
        fs.writeFileSync('comments/' + splitted[0] + '.json', JSON.stringify(obj));
        console.log(`${count}/${commentLinks.length}, num: ${obj.length}`);
        count++;
        setTimeout(() => {
          eachCB();
        }, 100);
      })
  })
});
