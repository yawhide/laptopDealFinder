const _ = require('lodash');
const async = require('async');
const Comments = require('../models/comments');
const CommentsProcessed = require('../models/comments-processed');
const Laptops = require('../models/laptops');
const log = require('better-logs')('process-comments');

// check if laptop exists
// create if not exists
// add comment to laptop
// create comments-processed

Promise.all([CommentsProcessed.sync, Laptops.sync])
  .then(() => {
    CommentsProcessed.findAll((err, commentsProcessed) => {
      if (err) { log.error(err); process.exit(1); }
      log.debug('commentsProcessed:', commentsProcessed)
      Comments.getNonProcessed(commentsProcessed.map(cp => cp.id), (err, comments) => {
        if (err) { log.error(err); process.exit(1); }
        async.eachLimit(comments, 1, (comment, eachLimitCB) => {
          if (err) { log.error(err); process.exit(1); }
          log.debug(comment.id)
          Laptops.getByCommentId(comment.id, (err, laptop) => {
            log.debug(5)
            if (err) { log.error(err); process.exit(1); }

          });
        });
      });
    });
  })
  .catch(err => {
    log.error(err)
  });

