const mongoose = require('mongoose')
const Schema = mongoose.Schema

const cartInteraction = new Schema({
  userId: { type: String, default: '' },
  productId: { type: String, default: '' },
  action: { type: String, enum: ['add_to_cart', 'remove_from_cart'], required: true },
  quantity: { type: Number, default: 1 },
  sessionId: { type: String, default: '' },
  deletedAt: { type: Date, default: null }
}, { timestamps: true })

module.exports = mongoose.model('cartInteraction', cartInteraction, 'cartInteractions')
