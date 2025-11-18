/**
 * ============================================
 * FILE: src/routes/user/trackRoute.js
 * ============================================
 * 
 * CHỨC NĂNG:
 * - Định nghĩa routes cho tracking APIs
 * 
 * ROUTES:
 * POST /api/track-product-view
 *   → trackController.trackProductView
 *   → Xử lý product view tracking
 * 
 * CỤ THỂ:
 * - Không cần authentication (public endpoint)
 * - Nhận request từ frontend script
 * - Cập nhật Product.viewCount nếu timeOnPage ≥ 5s
 */

const express = require('express')
const router = express.Router()
const trackController = require('../../app/controllers/user/trackController')

// POST track product view
router.post('/track-product-view', trackController.trackProductView)

module.exports = router
