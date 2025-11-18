/**
 * ============================================
 * FILE: src/app/services/analyticsService.js
 * ============================================
 * 
 * CHỨC NĂNG:
 * - Tính toán các metrics analytics từ dữ liệu có sẵn
 * - Top viewed: từ Product.viewCount (verified ≥5s)
 * - Top purchased: từ Product.saleNumber
 * - Top combined: viewed + purchased
 * 
 * FUNCTIONS:
 * - getTopViewedItems(limit): top items được xem ≥5s
 * - getTopPurchasedItems(limit): top items bán chạy nhất
 * - getTopCombinedItems(limit): top items hot nhất
 * - getProductMetrics(productId): chi tiết metrics 1 sản phẩm
 * - getSummaryMetrics(): tổng quan overview
 * 
 * DATA SOURCES:
 * - Product.viewCount: verified views (≥5s) từ tracking
 * - Product.saleNumber: số lượng bán thực tế
 * - Order collection: để tính metrics bổ sung
 */

const Product = require('../models/productModel')
const Order = require('../models/orderModel')

/**
 * Lấy top items được xem nhiều nhất (verified ≥5s)
 * @param {number} limit - Số lượng items (default: 10)
 * @returns {Array} Top viewed products
 */
const getTopViewedItems = async (limit = 10) => {
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

/**
 * Lấy top items được mua nhiều nhất
 * @param {number} limit - Số lượng items (default: 10)
 * @returns {Array} Top purchased products
 */
const getTopPurchasedItems = async (limit = 10) => {
  try {
    const topPurchased = await Product.find({ deletedAt: null })
      .select('_id name saleNumber price img categories brand')
      .sort({ saleNumber: -1 })
      .limit(limit)
      .lean()

    return topPurchased.map((product, index) => ({
      rank: index + 1,
      productId: product._id,
      name: product.name,
      purchaseCount: product.saleNumber || 0,
      price: product.price,
      image: product.img?.path || '',
      category: product.categories,
      brand: product.brand
    }))
  } catch (error) {
    console.error('Error fetching top purchased items:', error)
    throw error
  }
}

/**
 * Lấy top items kết hợp (viewed + purchased)
 * @param {number} limit - Số lượng items (default: 10)
 * @returns {Array} Top combined products
 */
const getTopCombinedItems = async (limit = 10) => {
  try {
    const allProducts = await Product.find({ deletedAt: null })
      .select('_id name viewCount saleNumber price img categories brand')
      .lean()

    // Tính totalInteraction = viewCount + saleNumber
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

/**
 * Tính metrics chi tiết của 1 sản phẩm
 * @param {string} productId - Product ID
 * @returns {Object} Product metrics
 */
const getProductMetrics = async (productId) => {
  try {
    const product = await Product.findById(productId)
      .select('name viewCount saleNumber price')
      .lean()

    if (!product) {
      throw new Error('Product not found')
    }

    // Tính doanh thu từ sản phẩm này
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
      // Conversion rate: purchases / views (nếu views > 0)
      conversionRate: (product.viewCount || 0) > 0
        ? Math.round((product.saleNumber || 0) / product.viewCount * 100)
        : 0
    }
  } catch (error) {
    console.error('Error fetching product metrics:', error)
    throw error
  }
}

/**
 * Tính metrics tổng quan
 * @returns {Object} Summary metrics
 */
const getSummaryMetrics = async () => {
  try {
    // Tổng số sản phẩm
    const totalProducts = await Product.countDocuments({ deletedAt: null })

    // Tổng số orders
    const totalOrders = await Order.countDocuments({ deletedAt: null })

    // Tổng views (sum của Product.viewCount)
    const totalViews = await Product.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: null, total: { $sum: '$viewCount' } } }
    ])

    // Tổng sales (sum của Product.saleNumber)
    const totalSales = await Product.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: null, total: { $sum: '$saleNumber' } } }
    ])

    // Tổng doanh thu
    const totalRevenue = await Order.aggregate([
      { $match: { deletedAt: null, isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalNewOrderPrice' } } }
    ])

    // Top product viewed
    const topViewed = await Product.findOne({ deletedAt: null })
      .select('name viewCount')
      .sort({ viewCount: -1 })
      .lean()

    // Top product purchased
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

module.exports = {
  getTopViewedItems,
  getTopPurchasedItems,
  getTopCombinedItems,
  getProductMetrics,
  getSummaryMetrics
}
