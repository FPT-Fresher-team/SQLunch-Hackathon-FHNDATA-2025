const express = require('express')
const router = express.Router()
const storeController = require('../../app/controllers/admin/storeController')
const storePermission = require('../../app/middleware/checkPermission').storeClass

router.get('/'               , storePermission.read   , storeController.allStores)

router.post('/store/created' , storeController.storeCreated)
router.put('/store/updated'  , storeController.storeUpdate)

router.post('/data/stores'   , storeController.getStores)
router.post('/data/store'    , storeController.getStore)
router.post('/data/filter'   , storeController.getFilter)

module.exports = router