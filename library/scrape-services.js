const fs = require('fs');
const path = require('path');

const serviceMap = {};

fs.readdirSync('scrape-services').forEach(dir => {
  serviceMap[path.basename(dir, '.js')] = require(`../scrape-services/${dir}`);
});

module.exports = serviceMap;
