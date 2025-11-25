const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const purchase = new Schema({
  
  supplierId          : { type: String, default: '' },
  purchaseDate        : { type: Date, default: '' },
  note                : { type: String, default: '' },
  totalProducts       : { type: Number, default: 0 },
  totalPurchasePrice  : { type: Number, default: 0 },
}, { timestamps: true })
module.exports = mongoose.model('purchase', purchase)