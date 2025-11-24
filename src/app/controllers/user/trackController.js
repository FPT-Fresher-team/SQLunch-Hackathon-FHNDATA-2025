const Product = require('../../models/productModel')

class trackController {
  async trackProductView(req, res) {
    try {
      const { productId, timeOnPage, sessionId, timestamp } = req.body

      console.log(req.body)

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

      const MIN_TIME = 5
      if (timeOnPage < MIN_TIME) {
        return res.status(200).json({
          success: true,
          message: `View time (${timeOnPage}s) less than minimum (${MIN_TIME}s), not tracked`,
          tracked: false
        })
      }

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
}

module.exports = new trackController()
