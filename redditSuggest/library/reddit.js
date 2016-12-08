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

console.log(config)

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

function _makeApiCall(suffix, cb) {
  if (!_authData) {
    return _getToken((err) => {
      if (err) return cb(err);
      setImmediate(() => {
        _makeApiCall(suffix, cb);
      });
    });
  }
  let options = {
    headers: {
      'User-Agent': config.reddit.userAgent,
      Authorization: `bearer ${_authData.access_token}`
    },
    method: 'GET',
    url: `https://oauth.reddit.com/api/v1/${suffix}`,
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
          _makeApiCall(suffix, cb);
        });
      });
    }
    cb(null, body);
  });
}

_makeApiCall(`r/${subreddits[0]}.json`, (err, body) => {
  console.log(err, body);
});

// r.getSubreddit(subreddits[0]).getNew({time: 'year'}).fetchAll().then(listings => {
//   console.log(listings.length);
//   fs.writeFileSync(`${new Date().getTime()}-${subreddits[0]}.json`, JSON.stringify(listings, null, 2));
// });

// r.getSubmission('4j8p6d').expandReplies({limit: Infinity, depth: Infinity}).then(console.log)
