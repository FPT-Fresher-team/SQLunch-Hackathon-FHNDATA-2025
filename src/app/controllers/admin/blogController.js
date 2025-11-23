require('dotenv').config()
const blog = require('../../models/blogModel')
const cloudinary = require('cloudinary').v2
const checkForHexRegExp = require('../../middleware/checkForHexRegExp')
const { ObjectId } = require('mongodb')

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key   : process.env.API_KEY,
  api_secret: process.env.API_SECRET,
})

class blogController {
  // All Blogs
  async getBlogs(req, res, next) {
    try {
      const currentPage  = req.body.page
      const sort         = req.body.sort
      const filter       = req.body.filter
      const itemsPerPage = req.body.itemsPerPage
      const skip         = (currentPage - 1) * itemsPerPage

      if (filter['_id']) {
        filter['_id'] = ObjectId.createFromHexString(filter['_id'])
      }

      const [data, dataSize] = await Promise.all([
        blog
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(itemsPerPage)
          .lean(),
        blog.find(filter).countDocuments(),
      ])
      if (!data) throw new Error('Data not found')
      
      return res.json({ data: data, data_size: dataSize })
    } catch (error) {
      return res.json({ error: error.message })
    }
  }

  async getFilter(req, res, next) {
    try {
      const categories = await blog.distinct('category.name')
      const statuses   = await blog.distinct('status')
      console.log(categories, statuses)
      return res.json({ categories: categories || [], statuses: statuses || [] })
    } catch (error) {
      return res.json({ error: error.message })
    }
  }
  
  async allBlogs(req, res, next) {
    try {
      return res.render('admin/all/blog', { title: 'Blog List', layout: 'admin' })
    } catch (error) {
      return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
    }
  }

  // Create Blog
  async blogCreate(req, res, next) {
    try {
      return res.render('admin/create/blog', { title: 'Create New Blog', layout: 'admin' })
    } catch (error) {
      return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
    }
  }

  async blogCreated(req, res, next) {
    try {
      const result = await cloudinary.uploader.upload(req.body.image, {
        folder: 'blogs',
        use_filename: true
      })

      // Validate required fields
      if (
        !req.body.title     ||
        !req.body.summary   ||
        !req.body.content
      ) {
        return res.json({ error: 'Title, summary and content are required' })
      }

      const newBlog = new blog({
        title   : req.body.title,
        summary : req.body.summary,
        content : req.body.content,
        category: req.body.category 
          ? JSON.parse(req.body.category)
          : { name: 'General', slug: 'general' },

        tags    : req.body.tags 
          ? JSON.parse(req.body.tags) 
          : [],

        status     : req.body.status || 'draft',
        publishedAt: req.body.status === 'published' ? new Date() : null,
        featuredImage: {
          path     : result.secure_url,
          filename : result.public_id
        }
      })

      await newBlog.save()
      return res.json({ isValid: true, message: 'Tạo blog mới thành công' })

    } catch (error) {
      console.log(error)
      return res.json({ error: error.message })
    }
  }

  // Detail Blog
  async getBlog(req, res, next) {
    try {
      const blogInfo = await blog.findOne({ _id: req.body.id }).lean()
      if (!blogInfo) throw new Error('Blog not found')

      return res.json({ blogInfo: blogInfo })
    } catch (error) {
      return res.json({ error: error.message })
    }
  }

  async blogInfo(req, res, next) {
    try {
      if (!checkForHexRegExp(req.params.id)) throw new Error('Invalid ID')
      if (!(await blog.findOne({ _id: req.params.id }).lean())) throw new Error('Blog not found')

      return res.render('admin/detail/blog', { layout: 'admin' })
    } catch (error) {
      return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
    }
  }

  async blogUpdate(req, res, next) {
    try {
      const { id, title, summary, content, category, tags, status } = req.body

      if (!id || !title || !summary || !content) {
        return res.json({ error: 'ID, title, summary, and content are required' })
      }

      const updateData = {
        title,
        summary,
        content,
        category: category ? JSON.parse(category) : undefined,
        tags: tags ? JSON.parse(tags) : undefined,
        status
      }

      // If changing to published, set published date
      if (status === 'published') {
        const existingBlog = await blog.findOne({ _id: id })
        if (!existingBlog.publishedAt) {
          updateData.publishedAt = new Date()
        }
      }

      const updatedBlog = await blog.findByIdAndUpdate(id, updateData, { new: true })
      
      if (!updatedBlog) throw new Error('Blog not found')

      return res.json({ message: 'Blog updated successfully', blog: updatedBlog })
    } catch (error) {
      return res.json({ error: error.message })
    }
  }

  // Delete Blog
  async deleteBlog(req, res, next) {
    try {
      const { id } = req.body

      if (!id) {
        return res.json({ error: 'Blog ID is required' })
      }

      const deletedBlog = await blog.findByIdAndDelete(id)

      if (!deletedBlog) throw new Error('Blog not found')

      return res.json({ message: 'Blog deleted successfully' })
    } catch (error) {
      return res.json({ error: error.message })
    }
  }
}

module.exports = new blogController