const {
  getTopViewedItems,
  getTopPurchasedItems,
  getTopCombinedItems,
  getProductMetrics,
  getSummaryMetrics
} = require('../../services/analyticsService')

const renderDashboard = async (req, res) => {
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

const getSummary = async (req, res) => {
  try {
    const data = await getSummaryMetrics()

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

const getTopViewed = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10
    const data = await getTopViewedItems(limit)

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

const getTopPurchased = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10
    const data = await getTopPurchasedItems(limit)

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

const getTopCombined = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10
    const data = await getTopCombinedItems(limit)

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

const getProductAnalytics = async (req, res) => {
  try {
    const { productId } = req.params
    const data = await getProductMetrics(productId)

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

module.exports = {
  renderDashboard,
  getSummary,
  getTopViewed,
  getTopPurchased,
  getTopCombined,
  getProductAnalytics
}
