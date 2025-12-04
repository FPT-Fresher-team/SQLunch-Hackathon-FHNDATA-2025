const Product = require('../models/productModel')
const Order = require('../models/orderModel')
const CartInteraction = require('../models/cartInteractionModel')

class conversionMetricsService {
  // Payment Success Rate: (Orders with isPaid=true & status='completed') / Total Orders
  async getPaymentSuccessRate(startDate = null, endDate = null) {
    try {
      const filter = { deletedAt: null }
      
      // Add date range filter if provided
      if (startDate || endDate) {
        filter.createdAt = {}
        if (startDate) {
          const start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          filter.createdAt.$gte = start
        }
        if (endDate) {
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          filter.createdAt.$lte = end
        }
      }

      console.log('[getPaymentSuccessRate] Filter:', JSON.stringify(filter, null, 2))
      
      const totalOrders = await Order.countDocuments(filter)
      
      const successfulOrders = await Order.countDocuments({
        ...filter,
        isPaid: true,
        status: 'done'
      })

      console.log('[getPaymentSuccessRate] Total:', totalOrders, 'Successful:', successfulOrders)

      return totalOrders > 0 ? Number((successfulOrders / totalOrders * 100).toFixed(2)) : 0
    } catch (error) {
      console.error('Error calculating payment success rate:', error)
      throw error
    }
  }

  // Payment Success Rate by Method
  async getPaymentSuccessRateByMethod(startDate = null, endDate = null) {
    try {
      const matchStage = { $match: { deletedAt: null } }
      
      // Add date range filter if provided
      if (startDate || endDate) {
        const dateFilter = {}
        if (startDate) {
          const start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          dateFilter.$gte = start
        }
        if (endDate) {
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          dateFilter.$lte = end
        }
        matchStage.$match.createdAt = dateFilter
      }

      console.log('[getPaymentSuccessRateByMethod] Filter stage:', JSON.stringify(matchStage, null, 2))

      const rateByMethod = await Order.aggregate([
        matchStage,
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

      console.log('[getPaymentSuccessRateByMethod] Results:', rateByMethod?.length || 0, 'methods')

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

  // Add to Cart Rate: (Net add_to_cart = add_to_cart - remove_from_cart) / (Total views from Product.viewCount)
  async getAddToCartRate() {
    try {
      const totalViews = await Product.aggregate([
        { $match: { deletedAt: null, viewCount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$viewCount' } } }
      ])

      // Get counts by action
      const cartCounts = await CartInteraction.aggregate([
        { $match: { deletedAt: null } },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        }
      ])

      // Calculate net adds
      const countMap = {}
      cartCounts.forEach(item => {
        countMap[item._id] = item.count
      })
      const totalAddToCart = countMap['add_to_cart'] || 0
      const totalRemoveFromCart = countMap['remove_from_cart'] || 0
      const netAdds = totalAddToCart - totalRemoveFromCart

      const totalViewCount = totalViews.length > 0 ? totalViews[0].total : 0

      return totalViewCount > 0 ? Number((totalAddToCart / totalViewCount * 100).toFixed(2)) : 0

    } catch (error) {
      console.error('Error calculating add to cart rate:', error)
      throw error

    }
  }

  // Add to Cart Rate by Product - using Product.viewCount and net adds (add_to_cart - remove_from_cart)
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

      // Get add and remove counts by product from CartInteraction
      const cartData = await CartInteraction.aggregate([
        { $match: { deletedAt: null } },
        {
          $group: {
            _id: {
              productId: '$productId',
              action: '$action'
            },
            count: { $sum: 1 }
          }
        }
      ])

      // Create map from cart data: {productId_action: count}
      const cartMap = {}
      cartData.forEach(cart => {
        const key = `${String(cart._id.productId)}_${cart._id.action}`
        cartMap[key] = cart.count
      })

      // Merge product data with cart data and calculate net add-to-cart rate
      const merged = products.map(product => {
        const productIdStr = String(product._id)
        const addToCartCount = cartMap[`${productIdStr}_add_to_cart`] || 0
        const removeFromCartCount = cartMap[`${productIdStr}_remove_from_cart`] || 0
        const netAdds = addToCartCount - removeFromCartCount
        const viewCount = product.viewCount || 0
        const rate = viewCount > 0 ? ((netAdds >= 0 ? netAdds : 0) / viewCount) * 100 : 0
        return {
          productId: product._id,
          productName: product.name || 'Unknown',
          viewCount: viewCount,
          addToCart: addToCartCount,
          removeFromCart: removeFromCartCount,
          netAdds: netAdds,
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
