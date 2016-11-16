var express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
  Newegg = mongoose.model('Newegg');
const _ = require('lodash');
const cronConfig = require('../../config/constants');
const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = function (app) {
  app.use('/newegg', router);
};

router.get('/usa/all', function (req, res, next) {
  Newegg.find(function (err, products) {
    if (err) return next(err);

    products = filterBySpecList(products);
    // go through products

    // aggregate into categories by graphics card?
    let graphicsCardGroup = {};
    products.forEach(product => {
      let graphicsCard = product.get('Graphics Card');
      let graphicsCardWithGRAM = `${product.get('Graphics Card')}:${product.get('Video Memory')}`;
      let altGraphicsCard = product.get('GPU/VPU');

      if (!graphicsCardGroup[graphicsCard]) graphicsCardGroup[graphicsCard] = [];
      if (!graphicsCardGroup[graphicsCardWithGRAM]) graphicsCardGroup[graphicsCardWithGRAM] = [];
      if (!graphicsCardGroup[altGraphicsCard]) graphicsCardGroup[altGraphicsCard] = [];

      if (graphicsCard) {
        graphicsCardGroup[graphicsCard].push(product);
        graphicsCardGroup[graphicsCardWithGRAM].push(product);
      } else {
        graphicsCardGroup[altGraphicsCard].push(product);
      }
    });
    // console.log(JSON.stringify(Object.keys(graphicsCardGroup), null, 3))

    let sortedByPrice = _.clone(products).sort((a,b) => {
      let left = a.getPrice || '1000000';
      let right = b.getPrice || '1000000';
      left = left.replace(/\D/g,'');
      right = right.replace(/\D/g,'');
      return parseInt(left) - parseInt(right);
    });
    // console.log(JSON.stringify(sortedByPrice.map(a=>a.priceHistory[a.priceHistory.length - 1].currentPrice), 3, null))
    // Newegg.find(
    // { 'priceHistory.currentPrice': '' },
    // { 'priceHistory.currentPrice': { '$slice': -1 } },
    // (err, results) => {
    //   console.log(err, results.map(r=>r.get('url')));
    // });

    res.render('newegg-usa-multi', {
      title: 'Newegg USA',
      products,
      sortedByPrice,
      graphicsCardGroup,
    });
  });
});

router.get('/usa/groupby/gpu', function (req, res, next) {
  Newegg.find(function (err, products) {
    if (err) return next(err);

    products = filterBySpecList(products);
    // go through products

    // aggregate into categories by graphics card?
    let graphicsCardGroup = _.groupBy(products, (product) => {
      return extractGPU(product.get('Graphics Card') ? `${product.get('Graphics Card')} ${product.get('Video Memory')}` : product.get('GPU/VPU'));
    });
    console.log(Object.keys(graphicsCardGroup).map(i=>`${i}: ${graphicsCardGroup[i].length}`))

    Object.keys(graphicsCardGroup).forEach(key=>{
      graphicsCardGroup[key].sort((a,b) => {
        let left = a.getPrice || '1000000';
        let right = b.getPrice || '1000000';
        left = left.replace(/\D/g,'');
        right = right.replace(/\D/g,'');
        return parseInt(left) - parseInt(right);
      });
    });

    res.render('newegg-usa-group-by-gpu', {
      title: 'Newegg USA',
      products,
      graphicsCardGroup,
    });
  });
});

router.post('/usa/create', function (req, res, next) {
  if (_.isEmpty(req.body)) {
    console.error('hit newegg usa create with an empty body');
    return res.sendStatus(400);
  }
  let data = _.cloneDeep(req.body);
  let priceInfo = _.cloneDeep(data.priceInfo);
  data.priceHistory = [priceInfo];
  delete data.priceInfo;

  Newegg.findOne({ neweggID: data.neweggID }, (err, product) => {
    if (err) {
      console.error(`Failed to findOne newegg product with id: ${data.neweggID}.`, err);
      return next(err);
    }
    if (!product) {
      return Newegg.create(data, (err, product) => {
        console.info(`created a new newegg doc: ${data.neweggID}`);
        res.sendStatus(200);
      });
    }
    product.images = data.images;
    product.priceHistory.push(priceInfo);
    product.save((err) => {
      if (err) {
        console.error(`Failed to update newegg product with id: ${data.neweggID}.`, err);
        return next(err);
      }
      console.info(`updated newegg doc: ${data.neweggID} with: ${JSON.stringify(priceInfo, null, 3)}`);
      res.sendStatus(200);
    });
  });
});

router.get('/usa/urllist', function (req, res, next) {
  let filePath = path.resolve(__dirname, `../../cron/${cronConfig.newegg.usa.gamingLaptop.savedFilePath}`);
  fs.readFile(filePath, 'utf8', (err, contents) => {
    if (err) {
      console.error('Failed to read local url list.', err);
      return next(err);
    }
    let urls = contents.split('\n');
    if (urls[urls.length - 1] === '') urls.splice(urls.length - 1);
    Newegg.find((err, products) => {
      if (err) {
        console.error('Failed to get all except urls.', err);
        return next(err);
      }
      let processedUrls = products.map(product => {
        if (!product.getPrice) return false;
        return product.get('url');
      }).filter(i=>i);
      let results = _.difference(urls, processedUrls);
      res.json(results);
    });
  });
});

router.get('/usa/:id', function (req, res, next) {
  Newegg.findById(req.params.id, function (err, product) {
    if (err) return next(err);
    // console.log(product)
    res.render('newegg-usa-single', {
      product: product._doc,
    });
  });
});

let filterBySpecList = function (products) {
  return products.filter(product => {
    let hasModel = product.get('Model') || product.get('Series');
    let hasCpu = product.get('CPU') || product.get('CPU Type') || product.get('CPU Speed');
    let hasGpu = product.get('Graphics Card') || product.get('Video Memory') || product.get('GPU/VPU');
    let hasRam = product.get('Memory Spec') || product.get('Memory Speed') || product.get('Memory');
    let hasStorage = product.get('HDD') || product.get('HDD RPM') || product.get('Storage') || product.get('HDD Spec');
    let hasDisplay = product.get('Screen Size') || product.get('Resolution') || product.get('Display Type') || product.get('Screen');
    return hasModel && hasGpu && (hasCpu || hasRam || hasStorage || hasDisplay);
  });
}

let extractGPU = function (str) {
  let gpus = [
    '670',
    '750m',
    '755m',
    '765m',
    '770m',
    '780m',
    '790m',
    '840m',
    '845m',
    '850m',
    '855m',
    '860m',
    '865m',
    '870m',
    '880m',
    '940m',
    '940mx',
    '950m',
    '955m',
    '960m',
    '965m',
    '970m',
    '980m',
    '980',
    'hd 6770m',
    'hd 8750m',
    'hd 8970m',
    'quadro m1000m',
    'quadro m600m',
    'r9 m290x',
    'r9 m375',
    '1060',
    '1070',
    '1080'
  ]
  let formattedStr = str.toLowerCase();
  for (var i = gpus.length - 1; i >= 0; i--) {
    if (formattedStr.indexOf(gpus[i]) > -1) return gpus[i];
  }
  return '';
}




[
   "GeForce GTX 960M",
   "GeForce GTX 960M:2 GB",
   "NVIDIA GeForce GTX 960M",
   "GeForce GTX 980M",
   "GeForce GTX 980M:4 GB",
   "NVIDIA GeForce GTX 980M",
   "Geforce GTX960M",
   "Geforce GTX960M:2 GB",
   "GeForce GTX 960M:4 GB",
   "GeForce GTX 950M",
   "GeForce GTX 950M:2 GB",
   "NVIDIA GeForce GTX 950M",
   "GeForce GTX 1070",
   "GeForce GTX 1070:8 GB",
   "NVIDIA GeForce GTX 1070",
   "GeForce GTX 970M",
   "GeForce GTX 970M:3 GB",
   "NVIDIA GeForce GTX 970M",
   "GeForce GTX 1060",
   "GeForce GTX 1060:6 GB",
   "NVIDIA GeForce GTX 1060",
   "NVIDIA GeForce GTX 1070:8 GB",
   "NVIDIA GeForce GTX 1060:6 GB",
   "NVIDIA GeForce GTX 950M:4 GB",
   "GeForce GTX 980M:8 GB",
   "Dual GeForce GTX 1080 SLI",
   "Dual GeForce GTX 1080 SLI:Dedicated 16 GB (8 GB each)",
   "NVIDIA GeForce GTX 1080 SLI",
   "GeForce GTX 1080",
   "GeForce GTX 1080:8 GB",
   "NVIDIA GeForce GTX 1080",
   "NVIDIA GeForce GTX 1060:3 GB",
   "GeForce GTX 970M:6 GB",
   "undefined",
   "undefined:6 GB",
   "Dual NVIDIA GeForce GTX 970M SLI",
   "Dual NVIDIA GeForce GTX 970M SLI:12 GB",
   "NVIDIA GeForce GTX 970M SLI",
   "NVIDIA GeForce GTX 965M",
   "NVIDIA GeForce GTX 965M:2 GB",
   "GeForce 940MX",
   "GeForce 940MX:Dedicated 2 GB GDDR3",
   "NVIDIA GeForce 940MX",
   "undefined:4 GB",
   "undefined:2 GB",
   "GeForce GTX960M 4GB",
   "GeForce GTX960M 4GB:4 GB",
   "NVIDIA  GeForce GTX 960M",
   "NVIDIA  GeForce GTX 960M:2 GB",
   "Dual GeForce GTX 1070 SLI",
   "Dual GeForce GTX 1070 SLI:Dedicated 16 GB (8 GB each)",
   "NVIDIA GeForce GTX 1070 SLI",
   "undefined:8 GB",
   "NVIDIA Geforce GTX 980M",
   "NVIDIA Geforce GTX 980M:8 GB",
   "GeForce GTX 950M:4 GB",
   "GeForce 940MX:2 GB",
   "Dual GeForce GTX 1080 SLI:16 GB",
   "GeForce GTX 980",
   "GeForce GTX 980:Dedicated 8 GB GDDR5",
   "NVIDIA GeForce GTX 980",
   "NVIDIA Geforce GTX 970M",
   "NVIDIA Geforce GTX 970M:3 GB",
   "NVIDIA GeForce GTX 980M:4 GB",
   "NVIDIA GeForce GTX970M with 3 GB GDDR5 VRAM",
   "NVIDIA GeForce GTX970M with 3 GB GDDR5 VRAM:3 GB",
   "NVIDIA GeForce GTX 960M:4 GB",
   "Dual NVIDIA GeForce GTX 1070 SLI",
   "Dual NVIDIA GeForce GTX 1070 SLI:Dedicated 16 GB (8 GB each)",
   "GeForce GTX 980:8 GB",
   "undefined:undefined",
   "NVIDIA GTX 1060 6G GDDR5",
   "NVIDIA GTX 1060 6G GDDR5:6 GB",
   "Geforce GTX 965M",
   "Geforce GTX 965M:2 GB",
   "NVIDIA GTX980M 4GB GDDR5",
   "NVIDIA GTX980M 4GB GDDR5:4GB GDDR5",
   "NVIDIA GeForce GTX 960M with 2 GB GDDR5 VRAM",
   "NVIDIA GeForce GTX 960M with 2 GB GDDR5 VRAM:2 GB",
   "NVIDIA GeForce GTX 860M",
   "NVIDIA Geforce GTX 960M",
   "NVIDIA Geforce GTX 960M:2 GB",
   "Nvidia GeForce GTX 860M",
   "Nvidia GeForce GTX 860M:2 GB",
   "NVIDIA GeForce GTX 960M:2 GB",
   "NVIDIA GeForce GTX950M",
   "NVIDIA GeForce GTX950M:undefined",
   "NVIDIA(R) GeForce(R) GTX 860M with 2GB GDDR5",
   "NVIDIA(R) GeForce(R) GTX 860M with 2GB GDDR5:undefined",
   "Dual NVIDIA GeForce GTX 980M SLI",
   "Dual NVIDIA GeForce GTX 980M SLI:Dedicated 16 GB GDDR5 (8 GB each)",
   "NVIDIA GeForce GTX 980M SLI",
   "NVIDIA GTX1060 6G GDDR5",
   "NVIDIA GTX1060 6G GDDR5:6 GB",
   "NVIDIA Geforce GTX 960M:4 GB",
   "NVIDIA Geforce GTX 970M:Dedicated 3 GB",
   "undefined:3 GB",
   "NVIDIA GeForce GTX 960M:undefined",
   "NVIDIA GeForce GTX 850M",
   "NVIDIA GeForce GTX 850M:2 GB",
   "NVidia GeForce 860M 2GB",
   "NVidia GeForce 860M 2GB:2 GB",
   "NVIDIA GeForce GTX 950M:2 GB",
   "NVIDIA GeForce GTX 970M:3 GB",
   "NVIDIA GeForce GTX 980M:8 GB",
   "NVIDIA GTX1060 6G GDDR5:12 GB",
   "NVIDIA GeForce GTX 860M:2 GB",
   "NVIDIA GeForce GTX 980M:undefined",
   "NVIDIA Geforce GTX 950M",
   "NVIDIA Geforce GTX 950M:2 GB",
   "NVIDIA Geforce 845M",
   "NVIDIA Geforce 845M:2 GB",
   "NVIDIA GeForce 845M",
   "HD Graphics 520",
   "HD Graphics 520:Shared system memory",
   "Intel HD Graphics 520",
   "NVIDIA GeForce GTX960M",
   "NVIDIA GeForce GTX960M:2 GB",
   "NVidia GeForce 960M 4GB",
   "NVidia GeForce 960M 4GB:4 GB",
   "NVIDIA Geforce GTX 860M",
   "NVIDIA Geforce GTX 860M:2 GB",
   "NVIDIA GeForce GTX 960M with 2GB GDDR5 Dedicated Memory",
   "NVIDIA GeForce GTX 960M with 2GB GDDR5 Dedicated Memory:undefined",
   "NVIDIA Geforce GTX980M",
   "NVIDIA Geforce GTX980M:4 GB",
   "Intel HD Graphics 5600",
   "Intel HD Graphics 5600:undefined",
   "NVIDIA Geforce GTX980M:8 GB",
   "NVIDIA Quadro M1000M - 2 GB GDDR5",
   "NVIDIA Quadro M1000M - 2 GB GDDR5:undefined",
   "NVIDIA Quadro M600M - 2 GB GDDR5 SDRAM",
   "NVIDIA Quadro M600M - 2 GB GDDR5 SDRAM:undefined",
   "NVIDIA Geforce GTX 950M:4 GB",
   "NVIDIA GeForce GTX 970M with 6GB GDDR5 Dedicated Memory",
   "NVIDIA GeForce GTX 970M with 6GB GDDR5 Dedicated Memory:undefined",
   "NVIDIA GTX970M 3GB GDDR5",
   "NVIDIA GTX970M 3GB GDDR5:3GB GDDR5",
   "NVIDIA GeForce GTX 970M with 3GB GDDR5 Dedicated Memory",
   "NVIDIA GeForce GTX 970M with 3GB GDDR5 Dedicated Memory:undefined",
   "2 x NVIDIA GeForce GTX 980M GPUs (SLI)",
   "2 x NVIDIA GeForce GTX 980M GPUs (SLI):8 GB",
   "NVIDIA GeForce GTX 970M:6 GB",
   "GeForce GTX 1060:3 GB",
   "Geforce GTX 860M",
   "Geforce GTX 860M:2 GB",
   "Dual GeForce GTX 970M SLI",
   "Dual GeForce GTX 970M SLI:Dedicated 6 GB x 2 (12 GB GDDR5)",
   "GeForce GTX 850M",
   "GeForce GTX 850M:2 GB",
   "Intel Iris Pro Graphics 5200",
   "Intel Iris Pro Graphics 5200:Shared system memory",
   "GeForce GTX 780M",
   "GeForce GTX 780M:Dedicated 4 GB GDDR5",
   "NVIDIA GeForce GTX 780M",
   "Dual GeForce GTX 980M SLI",
   "Dual GeForce GTX 980M SLI:Dedicated 8 GB x 2 (16 GB GDDR5)",
   "Dual NVIDIA GeForce GTX 980M SLI:Dedicated 8 GB Each",
   "GeForce GTX 970M:3 GB GDDR5",
   "NVIDIA GeForce GTX 860M:undefined",
   "NVIDIA Geforce GTX 965M",
   "NVIDIA Geforce GTX 965M:2 GB",
   "Dual NVIDIA Geforce GTX 980",
   "Dual NVIDIA Geforce GTX 980:Dedicated 8 GB each",
   "NVIDIA GeForce GTX 980 SLI",
   "NVIDIA Geforce GTX 970M:6 GB",
   "GeForce GTX 965M SLI",
   "GeForce GTX 965M SLI:4 GB",
   "NVIDIA GeForce GTX 965M SLI",
   "Geforce GTX970M",
   "Geforce GTX970M:3 GB",
   "NVIDIA GeForce GTX 965M:Dedicated 2 GB GDDR5",
   "Dual NVIDIA GeForce GTX 980 SLI",
   "Dual NVIDIA GeForce GTX 980 SLI:Dedicated 16 GB GDDR5",
   "Dual NVIDIA GeForce GTX 980M SLI:Dedicated 8 GB x 2 (16 GB GDDR5)",
   "GeForce GTX 970M:Dedicated 3 GB GDDR5",
   "NVIDIA GeForce GTX 980:Dedicated 8 GB GDDR5",
   "NVIDIA GeForce GTX 860M:4 GB",
   "NVIDIA Geforce GTX 780M",
   "NVIDIA Geforce GTX 780M:4 GB",
   "Dual Geforce GTX 980\n\n\n\n\n",
   "Dual Geforce GTX 980\n\n\n\n\n:Dedicated 8 GB each",
   "NVIDIA Geforce GTX 980M:4 GB",
   "NVIDIA Geforce GTX 770M",
   "NVIDIA Geforce GTX 770M:3 GB",
   "NVIDIA GeForce GTX 770M",
   "NVIDIA Geforce GTX 870M",
   "NVIDIA Geforce GTX 870M:3 GB",
   "NVIDIA GeForce GTX 870M",
   "NVIDIA Geforce GTX 880M",
   "NVIDIA Geforce GTX 880M:8 GB",
   "NVIDIA GeForce GTX 880M",
   "Dual NVIDIA GeForce GTX 860M\nNVIDIA SLI Enabled",
   "Dual NVIDIA GeForce GTX 860M\nNVIDIA SLI Enabled:Dedicated 2GB each Card",
   "NVIDIA Geforce GTX 880M:4 GB",
   "NVIDIA GeForce GT 840M",
   "NVIDIA GeForce GT 840M:2 GB",
   "NVIDIA GeForce 840M",
   "NVIDIA GeForce GTX 760M",
   "NVIDIA GeForce GTX 760M:2 GB",
   "NVIDIA Geforce GT 740M",
   "NVIDIA Geforce GT 740M:2 GB",
   "NVIDIA GeForce GT 740M",
   "NVIDIA Geforce GTX 765M",
   "NVIDIA Geforce GTX 765M:2 GB",
   "NVIDIA GeForce GTX 765M",
   "NVIDIA GeForce GTX 770M:3 GB",
   "Dual NVIDIA GeForce GT 755M SLI",
   "Dual NVIDIA GeForce GT 755M SLI:2 GB",
   "NVIDIA GeForce GT 750M",
   "NVIDIA GeForce GT 750M:2 GB",
   "2 x NVIDIA GeForce GTX 770M (Nvidia SLI)",
   "2 x NVIDIA GeForce GTX 770M (Nvidia SLI):3 GB",
   "AMD Radeon R9 M290X",
   "AMD Radeon R9 M290X:4 GB",
   "NVIDIA Geforce 940M",
   "NVIDIA Geforce 940M:4 GB",
   "NVIDIA GeForce GT 940M",
   "NVIDIA Geforce GTX 670(3D Vision)",
   "NVIDIA Geforce GTX 670(3D Vision):3 GB",
   "AMD Radeon HD 8970M",
   "AMD Radeon HD 8970M:2 GB",
   "2 x NVIDIA GeForce GT 750M (SLI)",
   "2 x NVIDIA GeForce GT 750M (SLI):2 GB",
   "NVIDIA GeForce GTX 765M:2 GB",
   "NVIDIA Geforce GT 750M",
   "NVIDIA Geforce GT 750M:2 GB",
   "AMD Radeon HD 8750M",
   "AMD Radeon HD 8750M:2GB",
   "NVIDIA GeForce GT 750M:4 GB",
   "NVIDIA GeForce GTX860M 2GB",
   "NVIDIA GeForce GTX860M 2GB:2 GB",
   "AMD Radeon HD 6770M",
   "AMD Radeon HD 6770M:3 GB",
   "Geforce GTX 965M:Dedicated 2 GB GDDR5",
   "GeForce GTX 950M:Dedicated 2 GB GDDR3",
   "Dual GeForce GTX 1070 SLI:16 GB",
   "NVIDIA GeForce GTX 970M graphics with 3GB graphics memory",
   "NVIDIA GeForce GTX 970M graphics with 3GB graphics memory:NVIDIA GeForce GTX 970M graphics with 3GB graphics memory",
   "NVIDIA GeForce GTX 970M graphics with 3GB graphics memory, Intel HD Graphics 530",
   "AMD Radeon R9 M375 2GB GDDR5",
   "AMD Radeon R9 M375 2GB GDDR5:undefined",
   "NVIDIA GeForce GTX 980M:Dedicated 8 GB GDDR5",
   "*NVIDIA GeForce GTX 970M"
]
