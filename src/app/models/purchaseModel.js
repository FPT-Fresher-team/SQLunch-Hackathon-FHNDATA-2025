const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const purchase = new Schema({
  products: [
    {
      id          : { type: String, default: '' },
      image       : { type: String, default: '' },
      name        : { type: String, default: '' },
      price       : { type: Number, default: 0 },
      quantity    : { type: Number, default: 0 },
      totalPrice  : { type: Number, default: 0 }
    }
  ],
  supplierId          : { type: String, default: '' },
  purchaseDate        : { type: Date, default: '' },
  note                : { type: String, default: '' },
  totalProducts       : { type: Number, default: 0 },
  totalPurchasePrice  : { type: Number, default: 0 },
}, { timestamps: true })
module.exports = mongoose.model('purchase', purchase)