const express = require('express')
const router = express.Router()
const cartTrackingController = require('../../app/controllers/user/cartTrackingController')

router.use(express.json())

// Track cart actions (public)
router.post('/track-cart-action', cartTrackingController.trackCartAction)

// Get cart interaction stats (for admin)
router.get('/cart-stats', cartTrackingController.getCartInteractionStats)

module.exports = router
