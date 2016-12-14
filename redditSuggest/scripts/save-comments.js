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

fs.readdir('comments/', (err, filePaths) => {
  if (err) log.error(err);
  async.eachLimit(filePaths, 1, (filePath, eachLimitCB) => {
    // log.debug(`"${filePath}", "${curFilePath.replace(/\n/g, '')}"`);
    log.debug('current filePath:', filePath);
    if (init && filePath !== curFilePath.replace(/\n/g, '')) {
      init = false;
      return eachLimitCB();
    }
    fs.writeFileSync(saveFilePath, filePath);
    let body;
    try {
      body = JSON.parse(fs.readFileSync(path.resolve('comments/', filePath)));
    } catch (e) {
      log.error(e);
      process.exit(1);
    }
    log.debug('starting all body, length:', body.length);
    async.eachLimit(body, 1, (commentInfo, eachLimitCB2) => {
      let redditUrl = commentInfo.redditUrl.substring(redditPrefixLen);
      reddit.getSomeComments(redditUrl, eachLimitCB2);
    }, () => {
      eachLimitCB();
    });
  });
});
