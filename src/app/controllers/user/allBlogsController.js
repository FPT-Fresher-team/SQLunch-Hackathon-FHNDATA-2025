const blog = require('../../models/blogModel')
const checkForHexRegExp = require('../../middleware/checkForHexRegExp')

class allBlogsController {
  async getBlogs(req, res, next) {
    try {
      const blogs = await blog.find({ status: 'published' }).sort({ publishedAt: -1 }).lean()
      if (!blogs) return res.json({ error: 'Blogs not found' })
      return res.json({ data: blogs })
    } catch (error) {
      return res.json({ error: error.message })
    }
  }

  async getBlog(req, res, next) {
    try {
      if (!checkForHexRegExp(req.body.id)) return res.status(403).json({ error: 'Invalid blog ID' })
      
      const blogInfo = await blog.findOne({ _id: req.body.id }).lean()
      if (!blogInfo) return res.json({ error: 'Blog not found' })
      
      // Increment views
      await blog.updateOne({ _id: req.body.id }, { $inc: { views: 1 } })
      
      return res.json({ data: blogInfo })
    } catch (error) {
      return res.json({ error: error.message })
    }
  }
  
  async getRelatedBlogs(req, res, next) {
    try {
      const relatedBlogs = await blog.find({
        category: req.body.category,
        status: 'published',
        _id: { $ne: req.body.id }
      }).limit(5).sort({ publishedAt: -1 }).lean()
      
      if (!relatedBlogs) return res.json({ error: 'Related blogs not found' })
      return res.json({ data: relatedBlogs })
    } catch (error) {
      return res.json({ error: error.message })
    }
  }

  async showAllBlogs(req, res, next) {
    return res.render('users/allBlogs', { title: 'All Blog Posts' })
  }

  async blogInfo(req, res, next) {
    if (!checkForHexRegExp(req.params.id)) {
      return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
    }
    
    const holderRelatedBlogs = Array(5).fill({})
    return res.render('users/detailBlog', { holderRelatedBlogs, blogId: req.params.id })
  }
}

module.exports = new allBlogsController