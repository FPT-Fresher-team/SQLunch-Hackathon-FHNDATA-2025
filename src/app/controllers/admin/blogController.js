require('dotenv').config()
const blog = require('../../models/blogModel')
const cloudinary = require('cloudinary').v2
const { ObjectId } = require('mongodb')

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key   : process.env.API_KEY,
  api_secret: process.env.API_SECRET,
})

class blogController {
  async getBlogs(req, res, next) {
    try {
      const currentPage  = req.body.page
      let sort           = req.body.sort
      let filter         = req.body.filter
      const itemsPerPage = req.body.itemsPerPage
      const skip         = (currentPage - 1) * itemsPerPage

      if (Object.keys(sort).length === 0) {
        sort = { updatedAt: -1 }
      }

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

  async getDeletedBlogs(req, res, next) {
    try {
      const currentPage  = req.body.page
      const itemsPerPage = 10
      const skip         = (currentPage - 1) * itemsPerPage
  
      const [data, dataSize] = await Promise.all([
        blog
          .find({ deletedAt: { $ne: null }})
          .skip(skip)
          .limit(itemsPerPage)
          .lean(),
        blog.find({ deletedAt: { $ne: null }}).countDocuments(),
      ]) 
      if (!data) throw new Error('Data not found')
      
      return res.json({data: data, data_size: dataSize})
    } catch (error) {
      return res.json({error: error.message})
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

  async trash(req, res, next) {
    try {
      return res.render('admin/all/blogTrash', { title: 'Blog Deleted', layout: 'admin' })
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
        category: req.body.category,
        tags    : req.body.tags 
          ? req.body.tags.split(',').map(t => t.trim()).filter(Boolean)
          : [],
        status     : req.body.status || 'draft',
        publishedAt: req.body.status === 'published' ? new Date() : null,
        featuredImage: {
          path     : result.secure_url,
          filename : result.public_id
        }
      })

      await newBlog.save()
      return res.json({ isValid: true, message: 'Created successfully' })

    } catch (error) {
      console.log(error)
      return res.json({ error: error.message })
    }
  }

  async getBlog(req, res, next) {
    try {
      const blogInfo = await blog.findOne({ _id: req.body.id }).lean()
      if (!blogInfo) throw new Error('Blog not found')

      return res.json({ blogInfo: blogInfo })
    } catch (error) {
      return res.json({ error: error.message })
    }
  }

  async blogUpdate(req, res) {
    try {
      const { id, title, summary, content, categoryName, tags, status, img, oldImageId } = req.body;

      if (!id || !title || !summary || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      let updateData = {
        title,
        summary,
        content,
        status,
      };

      // Parse JSON strings from frontend
      if (categoryName) updateData.category = categoryName;
      if (tags) updateData.tags = tags.split(',').map(t => t.trim()).filter(Boolean);

      // Handle image upload
      if (img) {
        const uploadResult = await cloudinary.uploader.upload(img, {
          folder: 'blogs',
          use_filename: true,
          unique_filename: false,
        });

        updateData.featuredImage = {
          path: uploadResult.secure_url,
          filename: uploadResult.public_id
        };

        // Delete old image if exists and different
        if (oldImageId && oldImageId !== uploadResult.public_id) {
          await cloudinary.uploader.destroy(oldImageId).catch(console.log);
        }
      }

      // Auto-set publishedAt: only once, when first going to "published"
      const existingBlog = await blog.findById(id);
      if (!existingBlog) {
        return res.status(404).json({ error: 'Blog not found' });
      }

      if (status === 'published' && existingBlog.status !== 'published' && !existingBlog.publishedAt) {
        updateData.publishedAt = new Date();
      }

      // If changing back to draft, optionally keep publishedAt (or clear it)
      // Remove this line if you want to keep the original publish date
      // if (status === 'draft') updateData.publishedAt = null;

      const updatedBlog = await blog.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      return res.json({
        message: 'Blog updated successfully',
        blog: updatedBlog
      });

    } catch (error) {
      console.error('Blog update error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  async softDelete(req, res, next) {
    try {
      await blog.updateOne({ _id: req.body.id}, { deletedAt: Date.now() })
      return res.json({isValid: true, message: 'Move blog to trash successfully'})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async deleteBlog(req, res, next) {
    try {
      const newBlog = await blog.findOne({ _id: req.body.id })
      const deleteImg = newBlog.featuredImage.filename
      
      await cloudinary.uploader.destroy(deleteImg)
      await blog.deleteOne({ _id: req.body.id })
  
      return res.json({isValid: true, message: 'Delete blog successfully'})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async restore(req, res, next) {
    try {
      console.log(req.body.id)
      await blog.updateOne({ _id: req.body.id}, { deletedAt: null })
      return res.json({message: 'Restore blog successfully'})
    } catch (error) {
      return res.json({error: error.message})
    }
  }
}

module.exports = new blogController