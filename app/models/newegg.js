var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var NeweggSchema = new Schema({
  priceHistory: [Schema.Types.Mixed],
  neweggID: String,
  url: String,
  images: [String],
}, { strict: false, timestamps: true });

mongoose.model('Newegg', NeweggSchema);
