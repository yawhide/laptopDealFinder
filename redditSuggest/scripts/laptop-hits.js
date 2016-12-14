const async = require('async');
const Xray = require('x-ray');

const x = Xray();

x('http://www.laptophits.com/', '.content ol li', [{
  amazonUrl: 'p.item a@href',
  comments: 'p.item-info a@href'
}])
  .paginate('a.next_page@href')
  .write('results.json');

