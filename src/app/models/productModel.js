const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const product = new Schema({
  categories   : { type: String, default: '' }, 
  subcategories: { type: String, default: '' },
  brand        : { type: String, default: '' },
  name         : { type: String, default: '' },
  purchasePrice: { type: Number, default: 0 },
  oldPrice     : { type: Number, default: 0 },  
  price        : { type: Number, default: 0 },
  quantity     : { type: Number, default: 0 },
  guide        : { type: String, default: '' },
  description  : { type: String, default: '' },
  details      : { type: String, default: '' },
  status       : { type: String, default: 'available' },
  isFlashDeal  : { type: Boolean, default: false },
  isNewArrival : { type: Boolean, default: false },
  isTopSelling : { type: Boolean, default: false },
  rate         : { type: Number, default: 0 },
  saleNumber   : { type: Number, default: 0 },
  rateNumber   : { type: Number, default: 0 },
  viewCount    : { type: Number, default: 0 },
  img          : { 
    path       : String,
    filename   : String,
  },
  slug         : { type: String, slug: 'name', unique: true },
  deletedAt    : {type: Date, default: null }
}, { timestamps: true })

module.exports = mongoose.model('product', product)