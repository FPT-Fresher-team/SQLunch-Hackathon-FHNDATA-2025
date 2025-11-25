const express = require('express')
const router = express.Router()
const productController = require('../../app/controllers/admin/productController')
const productPermission = require('../../app/middleware/checkPermission').productClass

router.get('/'                       , productPermission.read   , productController.allProducts)
router.get('/trash'                  , productPermission.read   , productController.trash)

router.post('/product/created'       , productController.productCreated)
router.put('/product/updated'        , productController.productUpdated)

router.delete('/product/soft-delete' , productController.softDelete)
router.delete('/product/delete'      , productController.deleteProduct)
router.post('/product/restore'       , productController.restore)

router.post('/data/products'         , productController.getProducts)
router.post('/data/product'          , productController.getProduct)
router.post('/data/filter'           , productController.getFilter)
router.post('/data/deleted-products' , productController.getDeletedProducts)

module.exports = router