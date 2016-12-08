const _ = require('lodash');
const config = require('../config/config');
const MongoClient = require('mongodb').MongoClient;

console.info(config.db);
MongoClient.connect(config.db, (err, db) => {
  if (err) {
    console.error(err);
    db.close();
    return;
  }
  console.info('successfully connected to db');
  let collection = db.collection('items');
  collection.find({}).toArray((err, docs) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log('docs:', docs);
    let groups = _.groupBy(docs.specifications, 'Brand');
    console.log(groups);
    db.close();
  });
});

