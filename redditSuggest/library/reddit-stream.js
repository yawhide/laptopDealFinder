const async = require('async');
const Comments = require('../models/comments');
const fs = require('fs');
const log = require('better-logs')('reddit-stream');
const reddit = require('./reddit');
const request = require('request');
const StringDecoder = require('string_decoder').StringDecoder;

let decoder = new StringDecoder('utf8');

let startId = fs.readFileSync('comment_id.txt', 'utf8');

const sites = [
  'amazon',
  'shopineer',
  'costco',
  'bestbuy',
  'bhphotovideo',
  'newegg',
  'microcenter',
  'officedepot',
  'microsoftstore',
  'lenovo',
  'hp',
  'apple',
  'dealsofamerica',
  'ebay'
];

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
    if (chunk.startsWith('data') && chunk.indexOf('.com') >= 0) {
      let parsed = JSON.parse(chunk.substring(5));
      let found = false;
      for (let i = 0; i < sites.length; i++) {
        if (parsed.body_html.indexOf(sites[i]) > -1) {
          found = true;
          break;
        }
      }
      if (found) {
        let row = {
          author: parsed.author, // author
          // parsed.body,
          body_html: parsed.body_html, // body_html
          comment_id: parsed.id, // comment_id
          created_utc: new Date(parsed.created_utc * 1000).toISOString(),
          link_id: parsed.link_id, // link_id ? t3_5iww5l
          name_id: parsed.name, // name ? t1_dbbr8kp
          subreddit: parsed.subreddit, // subreddit
          subreddit_id: parsed.subreddit_id, // subreddit_id
          thread_id: parsed.parent_id // thread_id
        }
        comments.push(row);
      }
    } else if (chunk.startsWith('id')) {
      startId = chunk.substring(3).trim();
    }
  });
  if (comments.length) {
    Comments.bulkCreate(comments, (err) => {
      if (err) {
        log.error('Failed to bulk create comments with:', comments, err);
      }
      // log.info('saved', comments.length, 'comments');
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
