const _ = require('lodash');
const async = require('async');
const fs = require('fs');
const log = require('better-logs')('save-comment-script');
const path = require('path');
const reddit = require('../library/reddit');

const saveFilePath = 'comment_file_path.txt';
const redditPrefixLen = 'https://www.reddit.com/'.length;

let curFilePath = fs.readFileSync(saveFilePath, 'utf8');
log.debug('saved filePath:', curFilePath);
let init = true;

let allUrls = [];

fs.readdir('comments/', (err, filePaths) => {
  if (err) log.error(err);
  filePaths.forEach(filePath => {
    let body = JSON.parse(fs.readFileSync(path.resolve('comments/', filePath), 'utf8'));
    body.forEach(info => {
      let splitted = info.redditUrl.split('/');
      allUrls.push(splitted.slice(0, splitted.length - 1).join('/'));
    });
  });
  allUrls = _.uniq(allUrls);
  log.debug(allUrls[0])
  fs.writeFileSync('uniq_comment_file_path.txt', JSON.stringify(allUrls));
  async.eachLimit(allUrls, 1, (uri, eachLimitCB) => {
    if (!curFilePath) {
      // do nothing
      init = false;
    }
    if (init && uri !== curFilePath) {
      init = false;
      return eachLimitCB();
    }
    fs.writeFileSync(saveFilePath, uri);
    // log.debug(uri.substring(redditPrefixLen) + '/.json')
    reddit.getSomeComments(uri.substring(redditPrefixLen) + '.json', eachLimitCB);
  }, (err) => {
    if (err) process.exit(1);
    log.debug('all done!', allUrls.length);
  });
});
