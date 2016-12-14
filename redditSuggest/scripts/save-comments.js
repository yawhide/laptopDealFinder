const async = require('async');
const fs = require('fs');
const log = require('better-logs')('save-comment-script');
const reddit = require('../models/reddit');

const saveFilePath = 'comment_file_path.txt';
const redditPrefixLen = 'https://www.reddit.com/'.length;

let curFilePath = fs.readFileSync(saveFilePath, 'utf8');
log.debug('curFilePath:', curFilePath);

fs.readdir('comments/', (err, filePaths) => {
  if (err) log.error(err);
  async.eachLimit(filePaths, 1, (filePath, eachLimitCB) => {
    log.debug(filePath)
    if (filePath !== curFilePath) return;
    fs.writeFileSync(saveFilePath, filePath);

    let body = JSON.parse(fs.readFileSync(filePath));
    body.forEach(commentInfo => {
      let redditUrl = commentInfo.redditUrl.substring(redditPrefixLen);
      log.debug('cur redditUrl:', redditUrl, filePath);
      reddit.getSomeComments(redditUrl, eachLimitCB);
    });
  });
});
