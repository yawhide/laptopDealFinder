const async = require('async');
const fs = require('fs');
const log = require('better-logs')('reddit-stream');
const reddit = require('../models/reddit');
const request = require('request');
const StringDecoder = require('string_decoder').StringDecoder;

let decoder = new StringDecoder('utf8');

let startId = fs.readFileSync('comment_id.txt', 'utf8');

let extraChunk = '';
const cargo = async.cargo((tasks, cargoCB) => {
  let comments = [];
  let str = extraChunk + tasks.reduce((a, b) => a + b);

  let splitted = str.split('\n');
  splitted.forEach((chunk, index) => {
    if (index === splitted.length - 1) {
      extraChunk = chunk;
      return;
    }
    if (chunk.startsWith('data') && chunk.indexOf('https://www.amazon.com') >= 0) {
      let parsed = JSON.parse(chunk.substring(5));
      let row = [
        parsed.author,
        parsed.body_html,
        parsed.id,
        new Date(parsed.created_utc * 1000).toISOString(),
        parsed.link_title,
        parsed.name,
        parsed.subreddit,
        parsed.subreddit_id,
        parsed.parent_id
      ];
      comments.push(row);
    } else if (chunk.startsWith('id')) {
      startId = chunk.substring(3).trim();
    }
  });
  if (comments.length) {
    reddit.saveComments(comments, (err) => {
      if (err) log.error(err, comments);
      log.info('saved', comments.length, 'comments');
      end();
    });
  } else {
    end();
  }
  function end() {
    fs.writeFile('comment_id.txt', startId, (err) => {
      // console.log('latest start id:', startId);
      cargoCB();
    });
  }
}, 1000);

function startRedditCommentStream() {
  log.info('hitting stream endpoint with start id:', startId);
  let req = request({
    method: 'GET',
    uri: `http://stream.pushshift.io/?event=t1&start_id=${startId}`,
    gzip: true
  });
  req.on('data', (chunk) => {
    let textChunk = decoder.write(chunk);
    cargo.push(textChunk);
  });
  req.on('end', () => {
    log.info('we are done finally....');
    setImmediate(startRedditCommentStream);
  });
}

startRedditCommentStream();
