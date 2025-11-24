const express = require('express')
const router = express.Router()
const blogController = require('../../app/controllers/admin/blogController')
const blogPermission = require('../../app/middleware/checkPermission').blogClass

router.get('/'              , blogPermission.read   , blogController.allBlogs)

router.post('/blog/created' , blogPermission.create , blogController.blogCreated)
router.put('/blog/updated'  , blogPermission.update , blogController.blogUpdate)

router.post('/data/blogs'   , blogPermission.read   , blogController.getBlogs)
router.post('/data/blog'    , blogPermission.read   , blogController.getBlog)
router.post('/data/filter'  , blogPermission.read   , blogController.getFilter)

router.post('/delete'       , blogPermission.delete , blogController.deleteBlog)

module.exports = router