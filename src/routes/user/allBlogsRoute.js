const express = require('express')
const router = express.Router()
const allBlogsController = require('../../app/controllers/user/allBlogsController')

router.get('/'                     , allBlogsController.showAllBlogs)
router.get('/blog/:id'             , allBlogsController.blogInfo)

router.post('/data/blogs'          , allBlogsController.getBlogs)
router.post('/data/blog'           , allBlogsController.getBlog)
router.post('/data/related-blogs'  , allBlogsController.getRelatedBlogs)

module.exports = router