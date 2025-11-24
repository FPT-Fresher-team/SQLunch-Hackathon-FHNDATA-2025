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
        status: 'completed'
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

  // Add to Cart Rate: (Total add_to_cart actions) / (Total view actions)
  async getAddToCartRate() {
    try {
      const totalViews = await CartInteraction.countDocuments({
        action: 'view',
        deletedAt: null
      })

      const totalAddToCart = await CartInteraction.countDocuments({
        action: 'add_to_cart',
        deletedAt: null
      })

      return totalViews > 0 ? Number((totalAddToCart / totalViews * 100).toFixed(2)) : 0
    } catch (error) {
      console.error('Error calculating add to cart rate:', error)
      throw error
    }
  }

  // Add to Cart Rate by Product
  async getAddToCartRateByProduct(limit = 10) {
    try {
      const data = await CartInteraction.aggregate([
        { $match: { deletedAt: null } },
        {
          $group: {
            _id: '$productId',
            views: {
              $sum: { $cond: [{ $eq: ['$action', 'view'] }, 1, 0] }
            },
            addToCart: {
              $sum: { $cond: [{ $eq: ['$action', 'add_to_cart'] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            _id: 1,
            views: 1,
            addToCart: 1,
            rate: {
              $cond: [
                { $eq: ['$views', 0] },
                0,
                { $multiply: [{ $divide: ['$addToCart', '$views'] }, 100] }
              ]
            }
          }
        },
        { $sort: { rate: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $unwind: {
            path: '$product',
            preserveNullAndEmptyArrays: true
          }
        }
      ])

      return data.map((item, index) => ({
        rank: index + 1,
        productId: item._id,
        productName: item.product?.name || 'Unknown',
        views: item.views,
        addToCart: item.addToCart,
        rate: Number(item.rate.toFixed(2))
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
