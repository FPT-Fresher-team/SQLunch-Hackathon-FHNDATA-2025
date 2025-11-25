const CartInteraction = require('../../models/cartInteractionModel')
const Product = require('../../models/productModel')

class cartTrackingController {
  async trackCartAction(req, res) {
    try {
      const { productId, action, quantity, sessionId } = req.body

      // Validate required fields
      if (!productId || !action) {
        return res.status(400).json({
          success: false,
          error: 'productId and action are required'
        })
      }

      // Validate action enum
      if (!['add_to_cart', 'remove_from_cart'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Must be add_to_cart or remove_from_cart'
        })
      }

      // Check if product exists
      const product = await Product.findById(productId)
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        })
      }

      const cartInteraction = new CartInteraction({
        userId: req.cookies.uid || '',
        productId,
        action,
        quantity: quantity || 1,
        sessionId: sessionId || generateSessionId()
      })

      await cartInteraction.save()

      return res.json({
        success: true,
        message: 'Cart action tracked successfully',
        data: cartInteraction
      })
    } catch (error) {
      console.error('Error tracking cart action:', error)
      return res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  // Get cart interaction stats (for admin)
  async getCartInteractionStats(req, res) {
    try {
      const stats = await CartInteraction.aggregate([
        { $match: { deletedAt: null } },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        }
      ])

      const result = {
        totalAddToCart: 0,
        totalRemoveFromCart: 0
      }

      stats.forEach(stat => {
        if (stat._id === 'add_to_cart') result.totalAddToCart = stat.count
        if (stat._id === 'remove_from_cart') result.totalRemoveFromCart = stat.count
      })

      return res.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.error('Error fetching cart interaction stats:', error)
      return res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
}

function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

module.exports = new cartTrackingController()
