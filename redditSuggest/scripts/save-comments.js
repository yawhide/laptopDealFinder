const async = require('async');
const fs = require('fs');
const reddit = require('../models/reddit');

const saveFilePath = 'comment_file_path.txt';
const redditPrefixLen = 'https://www.reddit.com/'.length;

let curFilePath = fs.readFileSync(saveFilePath, 'utf8');


fs.readdirSync('comments/', (err, filePaths) => {
  async.eachLimit(filePaths, 1, (filePath, eachLimitCB) => {
    if (filePath !== curFilePath) return;
    fs.writeFileSync(saveFilePath, filePath);

    let body = JSON.parse(fs.readFileSync(filePath));
    body.forEach(commentInfo => {
      let redditUrl = commentInfo.redditUrl.substring(redditPrefixLen);
      reddit.getSomeComments(redditUrl, eachLimitCB);
    });
  });
});
