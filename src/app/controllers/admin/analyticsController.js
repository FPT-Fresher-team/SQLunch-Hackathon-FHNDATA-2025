const analyticsService = require('../../services/analyticsService')
const conversionMetricsService = require('../../services/conversionMetricsService')

class analyticsController {
  async renderDashboard(req, res) {
    try {
      res.render('admin/analyticsView', {
        title: 'Analytics Dashboard'
      })
    } catch (error) {
      console.error('Error rendering analytics dashboard:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  async getSummary(req, res) {
    try {
      const data = await analyticsService.getSummaryMetrics()

      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error in getSummary:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  async getTopViewed(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10
      const data = await analyticsService.getTopViewedItems(limit)

      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error in getTopViewed:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  async getTopPurchased(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10
      const data = await analyticsService.getTopPurchasedItems(limit)

      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error in getTopPurchased:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  async getTopCombined(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10
      const data = await analyticsService.getTopCombinedItems(limit)

      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error in getTopCombined:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  async getProductAnalytics(req, res) {
    try {
      const { productId } = req.params
      const data = await analyticsService.getProductMetrics(productId)

      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error in getProductAnalytics:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  async getConversionMetrics(req, res) {
    try {
      const data = await conversionMetricsService.getAllConversionMetrics()

      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error in getConversionMetrics:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  async getPaymentSuccessRate(req, res) {
    try {
      const rate = await conversionMetricsService.getPaymentSuccessRate()
      const rateByMethod = await conversionMetricsService.getPaymentSuccessRateByMethod()

      res.json({
        success: true,
        data: {
          overallRate: rate,
          rateByMethod
        },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error in getPaymentSuccessRate:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  async getAddToCartRate(req, res) {
    try {
      const rate = await conversionMetricsService.getAddToCartRate()
      const rateByProduct = await conversionMetricsService.getAddToCartRateByProduct(10)

      res.json({
        success: true,
        data: {
          overallRate: rate,
          rateByProduct
        },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error in getAddToCartRate:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
}

module.exports = new analyticsController()
