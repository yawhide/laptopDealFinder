const async = require('async');
const config = require('./config');
const fs = require('fs');
const log = require('better-logs')('db');
const pg = require('pg');

let pool;
let prepCallbacks = [];

fs.readdir('models/', (err, modelPaths) => {
  if (err) throw new Error(err);
  let db = new pg.Pool(config.pg);
  let initQueries = [];
  modelPaths.forEach(modelPath => {
    try {
      const model = require(`./models/${modelPath}`);
      initQueries = initQueries.concat(model.init()); //TODO model.init, returns array of { text, values }
    } catch (e) {

    }
  });
  async.series(initQueries.map(sqlObj => {
    return (scb) => {
      db.query(sqlObj.text, sqlObj.values, () => {
        scb();
      });
    }
  }), (err) => {
    if (err) throw new Error(err);
    log.debug('successfully completed postgresql initialization');
    pool = db;
    async.each(prepCallbacks, (prepCallback, eachCB) => {
      prepCallback();
      eachCB();
    }, () => {
      prepCallbacks = [];
    });
  });
});

function prepare(cb) {
  if (pool) {
    return cb();
  }
  prepCallbacks.push(cb);
}

function query (text, values, cb) {
  prepare(() => {
    pool.query(text, values, cb);
  });
}

module.exports = {
  query,
};

// const Sequelize = require('sequelize');

// const db = new Sequelize(config.db.url, {
//   logging: false
// });

// module.exports = db;
