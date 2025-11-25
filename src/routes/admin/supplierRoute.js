const express = require('express')
const router = express.Router()
const supplierController = require('../../app/controllers/admin/supplierController')
const supplierPermission = require('../../app/middleware/checkPermission').supplierClass

router.get('/'                  , supplierPermission.read   , supplierController.allSuppliers)

router.post('/supplier/created' , supplierController.supplierCreated)
router.put('/supplier/updated'  , supplierController.supplierUpdate)

router.post('/data/suppliers'   , supplierController.getSuppliers)
router.post('/data/supplier'    , supplierController.getSupplier)
router.post('/data/filter'      , supplierController.getFilter)

module.exports = router