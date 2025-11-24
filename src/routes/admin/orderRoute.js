const express = require('express')
const router = express.Router()
const orderController = require('../../app/controllers/admin/orderController')
const orderPermission = require('../../app/middleware/checkPermission').orderClass

router.get('/'                    , orderPermission.read   , orderController.allOrders)

router.post('/order/created'      , orderController.orderCreated)
router.put('/order/updated'       , orderController.orderUpdate)

router.post('/data/orders'        , orderController.getOrders)
router.post('/data/order'         , orderController.getOrder)
router.post('/data/filter'        , orderController.getFilter)
router.post('/data/products'      , orderController.getProducts)

module.exports = router