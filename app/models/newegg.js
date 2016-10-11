var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

// const version = require('mongoose-version');

var NeweggSchema = new Schema({
  priceHistory: [Schema.Types.Mixed],
}, { strict: false, timestamps: true });

// NeweggSchema.virtual('date')
//   .get(function(){
//     return this._id.getTimestamp();
//   });

// NeweggSchema.plugin(version, { strategy: 'collection' });

mongoose.model('Newegg', NeweggSchema);
