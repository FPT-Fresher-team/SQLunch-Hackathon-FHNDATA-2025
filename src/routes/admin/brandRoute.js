const express = require('express')
const router = express.Router()
const brandController = require('../../app/controllers/admin/brandController')
const brandPermission = require('../../app/middleware/checkPermission').brandClass

router.get('/'              , brandPermission.read   , brandController.allBrands)

router.post('/brand/created', brandController.brandCreated)
router.put('/brand/updated' , brandController.brandUpdate)

router.post('/data/brands'  , brandController.getBrands)
router.post('/data/brand'   , brandController.getBrand)
router.post('/data/filter'  , brandController.getFilter)

module.exports = router