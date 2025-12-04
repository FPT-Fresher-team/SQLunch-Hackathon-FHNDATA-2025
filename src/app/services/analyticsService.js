const Product = require('../models/productModel')
const Order = require('../models/orderModel')

class analyticsService {
  async getTopViewedItems(limit = 10) {
    try {
      const topViewed = await Product.find({ deletedAt: null })
        .select('_id name viewCount price img categories brand')
        .sort({ viewCount: -1 })
        .limit(limit)
        .lean()

      return topViewed.map((product, index) => ({
        rank: index + 1,
        productId: product._id,
        name: product.name,
        viewCount: product.viewCount || 0,
        price: product.price,
        image: product.img?.path || '',
        category: product.categories,
        brand: product.brand
      }))
    } catch (error) {
      console.error('Error fetching top viewed items:', error)
      throw error
    }
  }

  async getTopPurchasedItems(limit = 10, startDate = null, endDate = null) {
    try {
      const matchStage = { $match: { deletedAt: null, isPaid: true } }
      
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

      console.log('[getTopPurchasedItems] Match stage:', JSON.stringify(matchStage, null, 2))

      const topPurchased = await Order.aggregate([
        matchStage,
        { $unwind: '$products' },
        {
          $group: {
            _id: '$products.id',
            totalQuantity: { $sum: '$products.quantity' },
            totalRevenue: { $sum: '$products.totalPrice' },
            productName: { $first: '$products.name' },
            productPrice: { $first: '$products.price' },
            productImage: { $first: '$products.image' }
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'product',
            let: { productId: { $toObjectId: '$_id' } },
            pipeline: [
              { $match: { $expr: { $eq: ['$_id', '$$productId'] } } },
              { $project: { name: 1, price: 1, img: 1, categories: 1, brand: 1 } }
            ],
            as: 'productInfo'
          }
        }
      ])

      console.log('[getTopPurchasedItems] Results found:', topPurchased.length)

      return topPurchased.map((item, index) => ({
        rank: index + 1,
        productId: item._id,
        name: item.productInfo.length > 0 ? item.productInfo[0].name : item.productName || 'Unknown',
        purchaseCount: item.totalQuantity || 0,
        totalRevenue: item.totalRevenue || 0,
        price: item.productInfo.length > 0 ? item.productInfo[0].price : item.productPrice || 0,
        image: item.productInfo.length > 0 ? item.productInfo[0].img?.path : item.productImage || '',
        category: item.productInfo.length > 0 ? item.productInfo[0].categories : [],
        brand: item.productInfo.length > 0 ? item.productInfo[0].brand : ''
      }))
    } catch (error) {
      console.error('Error fetching top purchased items:', error)
      throw error
    }
  }

  async getTopCombinedItems(limit = 10) {
    try {
      const allProducts = await Product.find({ deletedAt: null })
        .select('_id name viewCount saleNumber price img categories brand')
        .lean()

      const combined = allProducts
        .map(product => ({
          productId: product._id,
          name: product.name,
          viewCount: product.viewCount || 0,
          purchaseCount: product.saleNumber || 0,
          totalInteraction: (product.viewCount || 0) + (product.saleNumber || 0),
          price: product.price,
          image: product.img?.path || '',
          category: product.categories,
          brand: product.brand
        }))
        .sort((a, b) => b.totalInteraction - a.totalInteraction)
        .slice(0, limit)
        .map((item, index) => ({
          rank: index + 1,
          ...item
        }))

      return combined
    } catch (error) {
      console.error('Error fetching top combined items:', error)
      throw error
    }
  }

  async getProductMetrics(productId) {
    try {
      const product = await Product.findById(productId)
        .select('name viewCount saleNumber price')
        .lean()

      if (!product) {
        throw new Error('Product not found')
      }

      const revenue = await Order.aggregate([
        {
          $match: {
            deletedAt: null,
            'products.id': productId.toString()
          }
        },
        {
          $unwind: '$products'
        },
        {
          $match: {
            'products.id': productId.toString()
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$products.totalPrice' },
            totalQuantity: { $sum: '$products.quantity' }
          }
        }
      ])

      const revenueData = revenue[0] || { totalRevenue: 0, totalQuantity: 0 }

      return {
        productId: product._id,
        name: product.name,
        viewCount: product.viewCount || 0,
        purchaseCount: product.saleNumber || 0,
        totalRevenue: revenueData.totalRevenue,
        totalQuantitySold: revenueData.totalQuantity,
        price: product.price,
        conversionRate: (product.viewCount || 0) > 0
          ? Math.round((product.saleNumber || 0) / product.viewCount * 100)
          : 0
      }
    } catch (error) {
      console.error('Error fetching product metrics:', error)
      throw error
    }
  }

  async getSummaryMetrics() {
    try {
      const totalProducts = await Product.countDocuments({ deletedAt: null })

      const totalOrders = await Order.countDocuments({ deletedAt: null })

      const totalViews = await Product.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: null, total: { $sum: '$viewCount' } } }
      ])

      // Count actual sales quantity from Order table instead of Product.saleNumber
      const totalSales = await Order.aggregate([
        { $match: { deletedAt: null, isPaid: true } },
        { $unwind: '$products' },
        {
          $group: {
            _id: null,
            total: { $sum: '$products.quantity' }
          }
        }
      ])

      const totalRevenue = await Order.aggregate([
        { $match: { deletedAt: null, isPaid: true } },
        { $group: { _id: null, total: { $sum: '$totalNewOrderPrice' } } }
      ])

      const topViewed = await Product.findOne({ deletedAt: null })
        .select('name viewCount')
        .sort({ viewCount: -1 })
        .lean()

      const topPurchased = await Product.findOne({ deletedAt: null })
        .select('name saleNumber')
        .sort({ saleNumber: -1 })
        .lean()

      return {
        totalProducts,
        totalOrders,
        totalViews: totalViews[0]?.total || 0,
        totalSales: totalSales[0]?.total || 0,
        totalRevenue: totalRevenue[0]?.total || 0,
        topViewed: topViewed ? {
          name: topViewed.name,
          viewCount: topViewed.viewCount || 0
        } : null,
        topPurchased: topPurchased ? {
          name: topPurchased.name,
          purchaseCount: topPurchased.saleNumber || 0
        } : null
      }
    } catch (error) {
      console.error('Error fetching summary metrics:', error)
      throw error
    }
  }
}

module.exports = new analyticsService()
