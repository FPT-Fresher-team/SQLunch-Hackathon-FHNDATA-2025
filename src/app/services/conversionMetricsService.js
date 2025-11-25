const Product = require('../models/productModel')
const Order = require('../models/orderModel')
const CartInteraction = require('../models/cartInteractionModel')

class conversionMetricsService {
  // Payment Success Rate: (Orders with isPaid=true & status='completed') / Total Orders
  async getPaymentSuccessRate() {
    try {
      const totalOrders = await Order.countDocuments({ deletedAt: null })
      
      const successfulOrders = await Order.countDocuments({
        deletedAt: null,
        isPaid: true,
        status: 'done'
      })

      return totalOrders > 0 ? Number((successfulOrders / totalOrders * 100).toFixed(2)) : 0
    } catch (error) {
      console.error('Error calculating payment success rate:', error)
      throw error
    }
  }

  // Payment Success Rate by Method
  async getPaymentSuccessRateByMethod() {
    try {
      const rateByMethod = await Order.aggregate([
        { $match: { deletedAt: null } },
        {
          $group: {
            _id: '$paymentMethod',
            total: { $sum: 1 },
            successful: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$isPaid', true] },
                      { $eq: ['$status', 'done'] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            _id: 1,
            total: 1,
            successful: 1,
            rate: {
              $cond: [
                { $eq: ['$total', 0] },
                0,
                { $multiply: [{ $divide: ['$successful', '$total'] }, 100] }
              ]
            }
          }
        },
        { $sort: { rate: -1 } }
      ])

      return rateByMethod.map(item => ({
        paymentMethod: item._id || 'Unknown',
        total: item.total,
        successful: item.successful,
        rate: Number(item.rate.toFixed(2))
      }))
    } catch (error) {
      console.error('Error calculating payment success rate by method:', error)
      throw error
    }
  }

  // Add to Cart Rate: (Total add_to_cart actions) / (Total views from Product.viewCount)
  async getAddToCartRate() {
    try {
      const totalViews = await Product.aggregate([
        { $match: { deletedAt: null, viewCount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$viewCount' } } }
      ])

      const totalAddToCart = await CartInteraction.countDocuments({
        action: 'add_to_cart',
        deletedAt: null
      })

      const totalViewCount = totalViews.length > 0 ? totalViews[0].total : 0
      return totalViewCount > 0 ? Number((totalAddToCart / totalViewCount * 100).toFixed(2)) : 0
    } catch (error) {
      console.error('Error calculating add to cart rate:', error)
      throw error
    }
  }

  // Add to Cart Rate by Product - using Product.viewCount from DB
  async getAddToCartRateByProduct(limit = 10) {
    try {
      // Get all products with viewCount > 0
      const products = await Product.find(
        { deletedAt: null, viewCount: { $gt: 0 } },
        { _id: 1, name: 1, viewCount: 1 }
      ).lean()

      if (products.length === 0) {
        return []
      }

      // Get add to cart count by product from CartInteraction
      const cartData = await CartInteraction.aggregate([
        { $match: { action: 'add_to_cart', deletedAt: null } },
        {
          $group: {
            _id: '$productId',
            addToCartCount: { $sum: 1 }
          }
        }
      ])

      // Create map from add_to_cart data
      const cartMap = {}
      cartData.forEach(cart => {
        cartMap[String(cart._id)] = cart.addToCartCount
      })

      // Merge product data with cart data and calculate rate
      const merged = products.map(product => {
        const productIdStr = String(product._id)
        const addToCartCount = cartMap[productIdStr] || 0
        const viewCount = product.viewCount || 0
        const rate = viewCount > 0 ? (addToCartCount / viewCount) * 100 : 0

        return {
          productId: product._id,
          productName: product.name || 'Unknown',
          viewCount: viewCount,
          addToCart: addToCartCount,
          rate: Number(rate.toFixed(2))
        }
      })

      // Sort by rate and limit
      return merged
        .sort((a, b) => b.rate - a.rate)
        .slice(0, limit)
        .map((item, index) => ({
          rank: index + 1,
          ...item
        }))
    } catch (error) {
      console.error('Error calculating add to cart rate by product:', error)
      throw error
    }
  }

  // Get all conversion metrics
  async getAllConversionMetrics() {
    try {
      const paymentSuccessRate = await this.getPaymentSuccessRate()
      const addToCartRate = await this.getAddToCartRate()

      return {
        paymentSuccessRate,
        addToCartRate
      }
    } catch (error) {
      console.error('Error fetching all conversion metrics:', error)
      throw error
    }
  }
}

module.exports = new conversionMetricsService()
