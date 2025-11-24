const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const orderStatus = new Schema({
  code : { type: String, default: 'pending', unique: true }, 
  name : { type: String, default: 'Pending' }, 
  order: { type: Number, default: 1 }
}, { timestamps: true })
module.exports = mongoose.model('orderStatus', orderStatus, 'orderStatuses')