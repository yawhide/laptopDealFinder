const _ = require('lodash');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ItemsSchema = new Schema({
  model: { type: String, unique: true, index: true, required: true },
  sources: { type: Schema.Types.Mixed, required: true },
  // source: {
  //   country: String,
  //   id: String,
  //   images: [String],
  //   priceHistory: [{}],
  //   url: String,
  // },
  specifications: { type: Schema.Types.Mixed },
}, { /*strict: false, */timestamps: true });

ItemsSchema.virtual('getBestPrice').get(function() {
  // let bestPrice = Number.POSITIVE_INFINITY;
  // this.sources.forEach(source => {
  //   if (!source.priceHistory.length) return;
  //   let lastPriceHistory = source.priceHistory[source.priceHistory.length - 1];
  //   if (lastPriceHistory.specialPrice && lastPriceHistory.preSalePrice) {
  //     // if (lastPriceHistory.specialPrice.toLowerCase() === 'request price') {
  //     bestPrice = Math.max(bestPrice, Number(lastPriceHistory.preSalePrice));
  //     return;
  //     // }
  //     // return `less than ${lastPriceHistory.preSalePrice}`;
  //   }
  //   bestPrice = Math.max(bestPrice, Number(lastPriceHistory.price));
  // });
  // return bestPrice;
  let source = getBestPricedSource();
  let lastPriceHistory = source.priceHistory[source.priceHistory.length - 1];
  return lastPriceHistory.price;
});

ItemsSchema.virtual('getBestPriceSource').get(function () {
  return getBestPricedSource();
});

// ItemsSchema.virtual('isOutOfStock').get(function () {

//   //TODO
//   if (!this.priceHistory.length) return;
//   let lastPriceHistory = this.priceHistory[this.priceHistory.length - 1];
//   let lastListedPrice = '';
//   if (!lastPriceHistory.noteOnPrice || lastPriceHistory.noteOnPrice.toLowerCase().indexOf('out of stock') === -1) return false;
//   for (var i = this.priceHistory.length - 1; i >= 0; i--) {
//     lastListedPrice = this.priceHistory[i].price || this.priceHistory[i].preSalePrice;
//     if (lastListedPrice) break;
//   }
//   return `Out of stock. Last listed price: ${lastListedPrice || 'n/a'}`;
// });

mongoose.model('Items', ItemsSchema);


const getBestPricedSource = function () {
  let bestPrice = Number.POSITIVE_INFINITY;
  let bestPriceObj = {};
  this.sources.forEach(source => {
    if (!source.priceHistory.length) return;
    let lastPriceHistory = source.priceHistory[source.priceHistory.length - 1];
    if (lastPriceHistory.specialPrice && lastPriceHistory.preSalePrice) {
      // if (lastPriceHistory.specialPrice.toLowerCase() === 'request price') {
      let num = Number(lastPriceHistory.preSalePrice);
      if (bestPrice < num) {
        bestPrice = num;
        bestPriceObj = source;
      }
      return;
      // }
      // return `less than ${lastPriceHistory.preSalePrice}`;
    }
    let num = Number(lastPriceHistory.price);
    if (bestPrice < num) {
      bestPrice = num;
      bestPriceObj = source;
    }
  });
  return bestPriceObj;
}
