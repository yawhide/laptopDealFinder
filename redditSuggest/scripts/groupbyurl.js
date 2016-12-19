const _ = require('lodash');
const Comments = require('../models/comments');
const log = require('better-logs')('gorup-by-url');

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
      rows.forEach(row => {
        let body = row.body_html;
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
    });
  });
}

groupByLinks();
