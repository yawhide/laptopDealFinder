const pg = require('pg');
const config = require('config.js');

let pool = new pg.Pool(config.pg);

module.exports = {
   query: (text, values, cb) => {
    pool.query(text, values, cb);
      // pool.connect((err, client, done) => {
      //   client.query(text, values, (err, result) => {
      //     done();
      //     cb(err, result);
      //   });
      // });
   }
}
