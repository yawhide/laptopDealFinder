const _ = require('lodash');
const async = require('async');
const Comments = require('../models/comments');
const reddit = require('../library/reddit');
const log = require('better-logs')('group-by-url');

// test examples
function groupByLinks() {
  Comments.sync.then(() => {
    Comments.findAll((err, rows) => {
      if (err) {
        console.error(err);
        return;
      }
      let sites = [
        'amazon',
        'shopineer', // get links for referral
        'newegg',
        // we dont get referral for below
        'costco',
        'bestbuy',
        'bhphotovideo',
        'microcenter',
        'officedepot',
        'microsoftstore',
        'lenovo',
        'hp',
        'apple',
        'dealsofamerica',
        'ebay',
        'dell'
      ]
      let groups = { uncategorized: [] };
      sites.forEach(site => {
        groups[site] = [];
      });
      let amazonTitles = [];
      let amazonIds = [];
      async.eachLimit(rows, 5, (row, eachLimitCB) => {
        //TODO create a laptop row and save it
        if (!row.body_html) {
          return;
        }
        let body = row.body_html;
        let urls = reddit.parsedUrlsFromBody(body);
        if (urls.length) {
          // log.debug(urls);
          urls.forEach(uri => {
            if (uri.indexOf('amazon') > -1) {
              let splitted = uri.split('/');
              if (['gp', 'dp', 's'].indexOf(splitted[3]) > -1) {
                //[ 'https:', '', 'www.amazon.com', 'gp', 'product', 'B01KZ6BFJI' ]
                //[ 'https:', '', 'www.amazon.com', 'dp', 'B01N3S4IVX', 'ref=as_li_ss_tl' ]
                // [ 'https:', '', 'www.amazon.com', 's', 'ref=sr_ex_n_1' ]
                log.debug(splitted, uri)

              }
              amazonTitles.push(splitted[3])
              amazonIds.push(splitted[5])
            }
          });
        }
        let pushed = false;
        for (var i = 0; i < sites.length; i++) {
          if (body.indexOf(sites[i] + '.com') > -1) {
            groups[sites[i]].push(row);
            pushed = true;
          }
        }
        if (!pushed) groups['uncategorized'].push(row);
      });



      // log.debug(JSON.stringify(groups, null, 2));
      log.debug('rows.length:', rows.length)
      for (var i = 0; i < sites.length; i++) {
        log.debug(sites[i] + ' rows len:', groups[sites[i]].length)
      }
      log.debug('uncategorized rows len:', groups.uncategorized.length)
      // log.debug('uncategorized rows len:', groups.uncategorized.filter(obj => obj.body_html.indexOf('.com/') >= 0))

      // _.groupBy(groups[sites[i]])
      log.debug(_.uniq(amazonTitles))
      log.debug(_.uniq(amazonIds))
    });
  });
}

groupByLinks();
