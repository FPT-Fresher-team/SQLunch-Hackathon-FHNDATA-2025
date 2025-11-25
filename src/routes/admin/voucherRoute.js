const express = require('express')
const router = express.Router()
const voucherController = require('../../app/controllers/admin/voucherController')
const voucherPermission = require('../../app/middleware/checkPermission').voucherClass

router.get('/'                 , voucherPermission.read   , voucherController.allVouchers)

router.post('/voucher/created' , voucherController.voucherCreated)
router.put('/voucher/updated'  , voucherController.voucherUpdate)

router.post('/data/filter'     , voucherController.getFilter)
router.post('/data/vouchers'   , voucherController.getVouchers)
router.post('/data/voucher'    , voucherController.getVoucher)

module.exports = router