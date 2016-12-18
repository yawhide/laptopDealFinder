const _ = require('lodash');
const async = require('async');
const fs = require('fs');
const log = require('better-logs')('save-comment-script');
const path = require('path');
const reddit = require('../library/reddit');

const Comments = require('../models/comments');

const saveFilePath = 'scripts/comment_file_path.txt';
const redditPrefixLen = 'https://www.reddit.com/'.length;

let curFilePath = fs.readFileSync(saveFilePath, 'utf8');
log.debug('saved filePath contents:', curFilePath);
let init = true;

let allUrls = [];

Comments.sync.then(() => {
  log.debug('comments db is ready!');
  fs.readFile('scripts/uniq_comment_file_path.txt', 'utf8', (err, commentFileContents) => {
    // log.debug('uniq comment file path contents:', err, commentFileContents)
    if (commentFileContents) {
      log.debug('reading the contents of uniq_comment_file_path');
      allUrls = JSON.parse(commentFileContents);
    }
    fs.readdir('comments/', (err, filePaths) => {
      if (err) return log.error(err);

      if (!allUrls.length) {
        filePaths.forEach(filePath => {
          let body;
          try {
            body = JSON.parse(fs.readFileSync(path.resolve('comments/', filePath), 'utf8'));
          } catch (e) {
            log.error('failed to parse comments file', filePath, e);
            process.exit(1);
          }
          body.forEach(info => {
            let splitted = info.redditUrl.split('/');
            allUrls.push(splitted.slice(0, splitted.length - 1).join('/'));
          });
        });
        allUrls = _.uniq(allUrls);
        // log.debug(allUrls[0])
        log.debug('all urls len:', allUrls.length);
        fs.writeFileSync('scripts/uniq_comment_file_path.txt', JSON.stringify(allUrls));
        log.debug('successfully created uniq_comment_file_path.txt');
      } else {
        log.debug('read from local uniq_comment_file_path.txt');
      }
      let count = 0;
      async.eachLimit(allUrls, 1, (uri, eachLimitCB) => {
        if (!curFilePath) {
          // do nothing
          init = false;
        }
        if (init && uri !== curFilePath) {
          count++;
          return eachLimitCB();
        } else if (uri === curFilePath) {
          init = false;
          log.debug('found where we should be starting from...count:', count);
        }
        fs.writeFileSync(saveFilePath, uri);
        log.debug(count, uri.substring(redditPrefixLen) + '/.json')
        count++;
        reddit.getCommentsFromUrl(uri.substring(redditPrefixLen) + '.json', eachLimitCB);
      }, (err) => {
        if (err) {
          log.error(err);
          process.exit(1);
        }
        log.debug('all done!', allUrls.length);
      });
    });
  });
});
