const express = require('express')
const router = express.Router()
const blogController = require('../../app/controllers/admin/blogController')
const blogPermission = require('../../app/middleware/checkPermission').blogClass

router.get('/'                    , blogPermission.read   , blogController.allBlogs)
router.get('/trash'               , blogPermission.read   , blogController.trash)

router.post('/blog/created'       , blogPermission.create , blogController.blogCreated)
router.put('/blog/updated'        , blogPermission.update , blogController.blogUpdate)

router.delete('/blog/soft-delete' , blogController.softDelete)
router.delete('/blog/delete'      , blogController.deleteBlog)
router.post('/blog/restore'       , blogController.restore)

router.post('/data/blogs'         , blogPermission.read   , blogController.getBlogs)
router.post('/data/blog'          , blogPermission.read   , blogController.getBlog)
router.post('/data/filter'        , blogPermission.read   , blogController.getFilter)
router.post('/data/deleted-blogs' , blogPermission.read   , blogController.getDeletedBlogs)

module.exports = router