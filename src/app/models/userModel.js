const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const user = new Schema({
  email     : { type: String, unique: true },
  password  : { type: String, default: ''},
  role      : { type: String, default: 'user' },
  name      : { type: String, default: '' },
  phone     : { type: String, default: '' },
  gender    : { type: String, default: '' },
  address   : { type: String, default: '' },
  dob       : { type: Date, default: null},
  quantity  : { type: Number, default: 0 },
  revenue   : { type: Number, default: 0 },
  memberCode: { type: String, default: 'bronze'},
  isActive  : { type: Boolean, default: false },
  lastLogin : { type: Date, default: Date.now }, 
  favorites : {
    categories: {type: String, default: ''},
    skincare  : {type: String, default: ''},
    makeup    : {type: String, default: ''},
    brand     : {type: String, default: ''},
  },
  skinProfile: {
    skinType          : { type: String, enum: ['oil', 'dry', 'combination', 'sensitive', null], default: null },
    skinTypeLabel     : { type: String, enum: ['Dầu', 'Khô', 'Hỗn hợp', 'Nhạy cảm', null], default: null },
    skinConcerns      : [{ type: String, enum: ['acne', 'darkSpot', 'melasma', 'aging', 'largePores'], default: [] }],
    skinConcernLabels : [{ type: String, enum: ['Mụn', 'Thâm', 'Nám', 'Lão hóa', 'Lỗ chân lông to'], default: [] }],
    skinTone          : { type: String, enum: ['light', 'medium', 'tan', null], default: null },
    skinToneLabel     : { type: String, enum: ['Sáng', 'Trung bình', 'Ngăm', null], default: null },
    budget            : { type: String, enum: ['under200k', '200k-500k', 'over500k', null], default: null },
    budgetLabel       : { type: String, enum: ['< 200.000đ', '200.000đ - 500.000đ', '> 500.000đ', null], default: null }
  },
  slug      : { type: String, slug: 'name', unique: true },
}, { timestamps: true })
module.exports = mongoose.model('user', user)