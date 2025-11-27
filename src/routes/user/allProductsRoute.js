const express = require('express')
const router = express.Router()
const allProductsController = require('../../app/controllers/user/allProductsController')


router.get('/'                       , allProductsController.showAllProducts)
router.get('/isFlashDeal/true'       , allProductsController.showAllProducts)
router.get('/isTopSelling/true'      , allProductsController.showAllProducts)
router.get('/isNewArrival/true'      , allProductsController.showAllProducts)
router.get('/categories/:slug'       , allProductsController.showAllProducts)
router.get('/subcategories/:slug'    , allProductsController.showAllProducts)

router.get('/product/:id'            , allProductsController.productInfo)

router.post('/data/products'         , allProductsController.getProducts)
router.post('/data/product'          , allProductsController.getProduct)
router.post('/data/comment'          , allProductsController.getComment)
router.post('/data/related-category' , allProductsController.getRelatedCategory)
router.post('/data/related-type'     , allProductsController.getRelatedType)
router.post('/data/related-brand'    , allProductsController.getRelatedBrand)
router.post('/data/related-viewed'   , allProductsController.getRelatedViewed)
router.post('/data/related-recommend', allProductsController.getRelatedRecommend)

module.exports = router