const aws = require('aws-lib');

var prodAdv = aws.createProdAdvClient('AKIAJUEPYF5KBYLOAYTA', 'szwSNWgBBMcRP8mQe61Q4Ncb/9u4LsfNktD5Zwr2', yourAssociateTag);

var options = { SearchIndex: 'PCHardware', Keywords: '...' };

prodAdv.call('ItemSearch', options, function(err, result) {
  console.log(result);
});
