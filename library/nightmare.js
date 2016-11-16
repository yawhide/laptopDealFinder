const _ = require('lodash');
const async = require('async');
const config = require('../config/constants');
const Nightmare = require('nightmare');

const itemsHelper = require('./items-helper');

exports.runNightmare = function(fn, uris, cb) {

  console.log('we have', config.nightmare.numWorkers, 'workers');
  let urisPerWorker = uris.length / config.nightmare.numWorkers;

  async.each(Array.from({ length: config.nightmare.numWorkers }, (i, j) => j), (i, eachCB) => {
    let nightmare = new Nightmare(config.nightmare.settings);

    let arr = uris.slice(urisPerWorker*i,urisPerWorker*(i+1));

    async.each(arr.slice(0, 1), (uri, asyncCB) => {
      console.time(`${i}: ${uri}`);
      fn(nightmare, uri, (err, info) => {
        if (err || !info) {
          console.error(`Failed to run nightmare with uri: ${uri}.`, err);
          return asyncCB();
        }
        itemsHelper.writeToMongo(info.model, info.sourceName, info, (err) => {
          if (err) {
            console.error('Failed to write to mongo item.', err);
          }
          console.timeEnd(`${i}: ${uri}`);
          asyncCB();
        });
      });
    }, (err) => {
      nightmare.end().then().catch((err) => { console.error(err); });
      eachCB();
    });
  }, (err) => {
    cb();
  });
}
