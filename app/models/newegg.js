var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var NeweggSchema = new Schema({
  priceHistory: [Schema.Types.Mixed],
  neweggID: String,
  url: String,
  images: [String],
}, { strict: false, timestamps: true });

NeweggSchema.virtual('getPrice').get(function() {
  if (!this.priceHistory.length) return;
  let lastPriceHistory = this.priceHistory[this.priceHistory.length - 1];
  if (lastPriceHistory.specialPrice && lastPriceHistory.preSalePrice) {
    if (lastPriceHistory.specialPrice.toLowerCase() === 'request price') {
      return lastPriceHistory.preSalePrice;
    }
    return `less than ${lastPriceHistory.preSalePrice}`;
  }
  return lastPriceHistory.currentPrice;
});

NeweggSchema.virtual('isOutOfStock').get(function () {
  if (!this.priceHistory.length) return;
  let lastPriceHistory = this.priceHistory[this.priceHistory.length - 1];
  let lastListedPrice = '';
  if (!lastPriceHistory.outOfStock && (!lastPriceHistory.noteOnPrice || lastPriceHistory.noteOnPrice.toLowerCase().indexOf('out of stock') === -1)) return false;
  for (var i = this.priceHistory.length - 1; i >= 0; i--) {
    lastListedPrice = this.priceHistory[i].currentPrice || this.priceHistory[i].preSalePrice;
    if (lastListedPrice) break;
  }
  return `Out of stock. Last listed price: ${lastListedPrice || 'n/a'}`;
});

NeweggSchema.virtual('isNotAvailable').get(function () {
  if (!this.priceHistory.length) return;
  let lastPriceHistory = this.priceHistory[this.priceHistory.length - 1];
  if (lastPriceHistory.notAvailable) return true;
  return false;
});

mongoose.model('Newegg', NeweggSchema);
