/**
 * ============================================
 * FILE: src/app/controllers/user/trackController.js
 * ============================================
 * 
 * CHỨC NĂNG:
 * - Xử lý API request từ frontend tracking script
 * - Nhận product slug + thời gian user ở lại
 * - Nếu timeOnPage ≥ 5s → cập nhật Product.viewCount
 * 
 * ENDPOINTS:
 * POST /api/track-product-view
 * 
 * REQUEST BODY:
 * {
 *   productId: "chi-tiet-san-pham-xyz" (slug)
 *   timeOnPage: 15 (seconds)
 *   sessionId: "session_xxx_yyy"
 *   timestamp: "2025-11-18T10:30:00.000Z"
 * }
 * 
 * RESPONSE SUCCESS (200):
 * {
 *   success: true,
 *   message: "Product view tracked",
 *   viewCount: 42,
 *   productId: "chi-tiet-san-pham-xyz"
 * }
 * 
 * RESPONSE ERROR (400/500):
 * {
 *   success: false,
 *   error: "error message"
 * }
 * 
 * LOGIC:
 * 1. Validate input (productId, timeOnPage)
 * 2. Kiểm tra timeOnPage ≥ 5s
 * 3. Tìm product từ slug
 * 4. Increment viewCount
 * 5. Return updated viewCount
 */

const Product = require('../../models/productModel')

// POST /api/track-product-view
const trackProductView = async (req, res) => {
  try {
    const { productId, timeOnPage, sessionId, timestamp } = req.body

    console.log(req.body)

    // Validate required fields
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'productId is required'
      })
    }

    if (typeof timeOnPage !== 'number' || timeOnPage < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timeOnPage'
      })
    }

    // Chỉ track nếu timeOnPage ≥ 5 giây
    const MIN_TIME = 5
    if (timeOnPage < MIN_TIME) {
      return res.status(200).json({
        success: true,
        message: `View time (${timeOnPage}s) less than minimum (${MIN_TIME}s), not tracked`,
        tracked: false
      })
    }

    // Tìm product bằng slug (productId chính là slug)
    const product = await Product.findOne({
      _id: productId,
      deletedAt: null
    })

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      })
    }

    // Increment viewCount
    product.viewCount = (product.viewCount || 0) + 1
    await product.save()

    console.log(`✅ Product view tracked: ${productId} (${timeOnPage}s) - viewCount: ${product.viewCount}`)

    return res.status(200).json({
      success: true,
      message: 'Product view tracked',
      tracked: true,
      productId: product._id,
      productSlug: product.slug,
      viewCount: product.viewCount,
      timeOnPage: timeOnPage
    })
  } catch (error) {
    console.error('Error tracking product view:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

module.exports = {
  trackProductView
}
