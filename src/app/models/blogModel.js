const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)

const Schema = mongoose.Schema

const blog = new Schema({
  title : { type: String, required: true },
  slug  : { type: String, slug: "title", unique: true },
  featuredImage: {
    path: String,
    filename: String
  },
  summary : { type: String, default: '' },
  content : { type: String, default: '' },
  category: { type: String, default: '' },
  categorySlug: { type: String, slug: "category" },
  tags        : [{ type: String }],
  status      : { type: String, enum: ['draft', 'published'], default: 'draft' },
  publishedAt : { type: Date, default: null },
  views       : { type: Number, default: 0 },
  deletedAt   : { type: Date, default: null }
}, { timestamps: true })

module.exports = mongoose.model('blog', blog)