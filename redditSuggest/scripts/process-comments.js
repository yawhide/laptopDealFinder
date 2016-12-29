const _ = require('lodash');
const async = require('async');
const Comments = require('../models/comments');
const fs = require('fs');
const Laptops = require('../models/laptops');
const log = require('better-logs')('process-comments');

// check if laptop exists
// create if not exists
// create comment
// set flag to processed to comment
// add entry in comments_laptops

fs.readFile('scripts/comments_backup.json', 'utf8', (err, body) => {
  if (err) { log.error(err); process.exit(1); }
  let data = JSON.parse(body);
  async.eachLimit(data, 1, (comment, eachLimitCB) => {
    if (err) { log.error(err); process.exit(1); }
    if (!comment.urls) return eachLimitCB();
    let data = _.cloneDeep(comment);
    delete data.id;
    delete data.created_at;
    delete data.updated_at;
    delete data.processed;
      /*
  {
    "id": 1,
    "author": "shopineer",
    "body_html": "&lt;div class=\"md\"&gt;&lt;p&gt;Thanks, I will try to get that fixed! :)&lt;/p&gt;\n&lt;/div&gt;",
    "comment_id": "dbc2y2o",
    "created_utc": "2016-12-18T07:15:42.000Z",
    "link_id": "t3_5iww5l",
    "name_id": "t1_dbc2y2o",
    "subreddit": "SuggestALaptop",
    "subreddit_id": "t5_2s4k5",
    "thread_id": "t1_dbbmw7b",
    "urls": null,
    "created_at": "2016-12-19T01:46:33.476Z",
    "updated_at": "2016-12-26T19:04:17.001Z",
    "processed": false
  },
      */
    // log.debug(comment)
    Comments.create(data, (err) => {
      if (err) { log.error(err); process.exit(1); }
      Laptops.bulkCreateFromComment(comment, (err, laptops) => {
        if (err) { log.error(err); process.exit(1); }
        Comments.update(comment, { processed: true }, (err, result) => {
          if (err) { log.error(err); process.exit(1); }
          eachLimitCB();
        });
      });
    });
  });
});
