const async = require('async');
const fs = require('fs');
const Xray = require('x-ray');

const x = Xray();

const resultFilePath = 'scripts/laptop-hits-stage-1.json';

try {
  fs.unlinkSync(resultFilePath);
} catch (e) {

}

x('http://www.laptophits.com/', '.content ol li', [{
  amazonUrl: 'p.item a@href',
  comments: 'p.item-info a@href'
}])
  .paginate('a.next_page@href')
  .write(resultFilePath);

