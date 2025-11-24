/**
 * ============================================
 * FILE: src/routes/admin/analyticsRoute.js
 * ============================================
 * 
 * CHỨC NĂNG:
 * - Định nghĩa routes cho analytics endpoints
 * - Tất cả routes require checkAdmin middleware
 * 
 * ROUTES:
 * GET /admin/analytics                    → renderDashboard
 * GET /admin/analytics/summary            → getSummary
 * GET /admin/analytics/top-viewed         → getTopViewed
 * GET /admin/analytics/top-purchased      → getTopPurchased
 * GET /admin/analytics/top-combined       → getTopCombined
 * GET /admin/analytics/product/:id        → getProductAnalytics
 */

const express = require('express')
const router = express.Router()
const analyticsController = require('../../app/controllers/admin/analyticsController')

// GET dashboard view (HTML)
router.get('/', analyticsController.renderDashboard)

// GET summary metrics (JSON)
router.get('/summary', analyticsController.getSummary)

// GET top viewed items (JSON) - verified ≥5s
router.get('/top-viewed', analyticsController.getTopViewed)

// GET top purchased items (JSON)
router.get('/top-purchased', analyticsController.getTopPurchased)

// GET top combined (viewed + purchased) (JSON)
router.get('/top-combined', analyticsController.getTopCombined)

// GET product metrics (JSON)
router.get('/product/:productId', analyticsController.getProductAnalytics)

// GET getConversionMetrics (JSON)
router.get('/conversion-metrics/all', analyticsController.getConversionMetrics)

// GET getConversionMetrics (JSON)
router.get('/payment-success-rate-by-method', analyticsController.getPaymentSuccessRate)

router.get('/add-to-cart-rate-by-product', analyticsController.getAddToCartRate)
module.exports = router
