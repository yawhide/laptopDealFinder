const _ = require('lodash');
const config = require('../config');
const fs = require('fs');
const request = require('request');

const subreddits = [
  'SuggestALaptop',
  'Cameras',
  'photography',
  'drones',
  'suggestapc',
  'buildapc',
  'buildmeapc',
  'gamingsuggestions'
];
const _authTokenPath = 'reddit_auth_token';

let _authData;
try {
  _authData = JSON.parse(fs.readFileSync(_authTokenPath, 'utf8'));
} catch (e) {
  console.error(e);
}

// console.log(config)

function _getToken(cb) {
  console.log(_.get(_authData, 'expiresEpochTime', 0), new Date().getTime() + 60 * 60 * 1000);
  if (_.get(_authData, 'expiresEpochTime', 0) >= new Date().getTime() + 60 * 60 * 1000) {
    console.info('using saved _auth info');
    return cb(null, _authData);
  }
  let options = {
    auth: {
      user: `${config.reddit.clientId}`,
      password: `${config.reddit.clientSecret}`
    },
    headers: {
      'User-Agent': config.reddit.userAgent
    },
    method: 'POST',
    url: 'https://www.reddit.com/api/v1/access_token',
    qs: {
      grant_type: 'password',
      username: config.reddit.username,
      password: config.reddit.password
    }
  };
  request(options, (err, response, body) => {
    if (err) {
      console.error(`Error when trying to get new token.`, err);
      return cb(err);
    }
    try {
      body = JSON.parse(body);
    } catch (e) {
      console.error(`Failed to get token, repsonse is not json.`, e);
      return cb(e);
    }
    fs.writeFile('reddit_auth_token', JSON.stringify(body, null, 2), (err) => {
      if (err) {
        console.error(`Error when trying to save new auth token.`, err);
        return cb(err);
      }
      _authData = body;
      _authData.expiresEpochTime = new Date().getTime() + body.expires_in * 1000;
      fs.writeFile(_authTokenPath, JSON.stringify(body), (err) => {
        if (err) {
          console.error(`Failed to write new auth token info.`, err);
          return cb(err);
        }
        console.info('successfully updated the auth token:', _authData);
        cb(null, _authData);
      });
    });
  });
}

function _makeApiCall(suffix, qs, cb) {
  if (!_authData) {
    return _getToken((err) => {
      if (err) return cb(err);
      setImmediate(() => {
        _makeApiCall(suffix, qs, cb);
      });
    });
  }
  let options = {
    headers: {
      'User-Agent': config.reddit.userAgent,
      Authorization: `bearer ${_authData.access_token}`
    },
    method: 'GET',
    url: `https://oauth.reddit.com/${suffix}`,
    qs,
    json: true
  };
  request(options, (err, resp, body) => {
    if (err) {
      console.error(`Error when trying to make reddit api call.`, err);
      return cb(err);
    }
    if (resp.statusCode === 401) {
      return _getToken((err) => {
        if (err) return cb(err);
        setImmediate(() => {
          _makeApiCall(suffix, qs, cb);
        });
      });
    }
    cb(null, body);
  });
}

function getAllSubredditsFromPastYear() {
  const lastYearTodayUnixTimestamp = Math.floor((new Date().setYear(new Date().getFullYear() - 1)) / 1000);
  const uri = `r/${subreddits[0]}/new`;
  let count = 0;
  let after = '';
  function run() {
    let qs = { raw_json: 1, count, limit: 100, show: 'all', after };
    _makeApiCall(uri, qs, (err, body) => {
      // console.log(err, body);
      // console.log(JSON.stringify(body.data.children.map(c=>c.data.created, null, 2)));
      if (body.data.children[0].data.created < lastYearTodayUnixTimestamp) {
        return;
      }
      let data = body.data.children.map(c => formatSubredditForDb(c)).filter(c => c);
      console.log(JSON.stringify(data, null, 2));
      //TODO save to db
      after = body.data.after;
      count += 100;
      setImmediate(run);
    });
  }
  run();
}

function formatSubredditForDb(child) {
  if (child.kind !== 't3') return;
  return {
    created_utc: child.data.created_utc,
    permalink: child.data.permalink,
    // selftext: child.data.selftext,
    selftext_html: child.data.selftext_html,
    subreddit: child.data.subreddit,
    subreddit_id: child.data.subreddit_id,
    thread_id: child.data.id,
    title: child.data.title
  };
}

function formatCommentForDb(child) {
  if (child.kind !== 't1') return;
  return {
    author: child.data.author,
    // body: child.data.body,
    body_html: child.data.body_html,
    comment_id: child.data.id,
    created_utc: child.data.created_utc,
    subreddit: child.data.subreddit,
    subreddit_id: child.data.subreddit_id,
    thread_id: child.data.parent_id
  };
}

getAllSubredditsFromPastYear()




_makeApiCall(`r/${subreddits[0]}/comments/5h7mgh`, { showmore: true}, (err, body) => {
  // console.log(err, body);
  // console.log(JSON.stringify(body, null, 2));
  let data = [];
  body.forEach(listing => {
    listing.data.children.forEach(child => {
      if (child.kind === 't1') {
        data.push(formatCommentForDb(child));
      }
    });
  });
  data = data.filter(c => c);
  console.log(JSON.stringify(data, null, 2));
});
