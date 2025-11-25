const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const voucher = new Schema({
  code        : { type: String, slug: 'name', unique: true }, 
  name        : { type: String, default: '' }, 
  description : { type: String, default: '' },
  memberCode  : { type: String, default: '' },
  discount    : { type: Number, default: 0 },
  maxDiscount : { type: Number, default: 0 },
  minOrder    : { type: Number, default: 0 },
  status      : { type: String, enum: ['active', 'expired'], default: 'active' },
  startDate   : { type: Date, default: Date.now },
  endDate     : { type: Date, default: Date.now },
  usedCount   : { type: Number, default: 0 },
}, { timestamps: true })
module.exports = mongoose.model('voucher', voucher, 'vouchers')