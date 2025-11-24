const mongoose = require('mongoose')
const Schema = mongoose.Schema

const searchHistory = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'user', required: true, index: true },
  keyword: { type: String, required: true, trim: true, lowercase: true },

  sessionId: {
    type: String,
    default: null
  },
  device: {
    type: String,
    enum: ['mobile', 'desktop', 'tablet'],
    default: 'desktop'
  },
  ip: {
    type: String,
    default: null
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('searchHistory', searchHistory)