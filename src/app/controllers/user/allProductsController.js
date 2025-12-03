const product = require('../../models/productModel')
const productStatuses = require('../../models/productStatusModel')
const userView = require('../../models/userViewModel')
const comment = require('../../models/commentModel')
const checkForHexRegExp = require('../../middleware/checkForHexRegExp')

class allProductsController {
  async getProducts(req, res, next) {
    try {
      const currentPage  = req.body.page
      let sort           = req.body.sort
      let filter         = req.body.filter
      const itemsPerPage = req.body.limit
      const skip         = (currentPage - 1) * itemsPerPage

      if (filter.hasOwnProperty('price')) {
        filter.price = { $gt: filter.price.split('-')[0], $lt: filter.price.split('-')[1] }
      }

      const [data, productLength] = await Promise.all([
        product
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(itemsPerPage)
          .lean(),
        product.find(filter).countDocuments(),
      ]) 
      if (!data) res.status(404).json({data: [], data_size: 0})
      
      return res.json({data: data, data_size: productLength})

    } catch (error) {
      return res.json({error: error})
    }
  }

  async getProduct(req, res, next) {
    try {
      const productId = req.body.productId
      const productInfo = await product.findOne({ _id: productId }).lean()
      if (!productInfo) return res.status(404).json({ error: "No products found" })
      
      return res.json({data: productInfo})
      
    } catch (error) {
      return res.json({error: error})
    }
  }

  async getRelatedCategory(req, res, next) {
    try {
      const productId   = req.body.productId
      const categories  = req.body.categories
      const productInfo = await product.find({ _id: { $ne: productId }, categories: categories }).sort({rate: -1}).lean()
      return res.json({data: productInfo || []})
      
    } catch (error) {
      return res.json({error: error})
    }
  }
  
  async getRelatedType(req, res, next) {
    try {
      const productId = req.body.productId
      const categories = req.body.categories
      const type = req.body.type
      const productInfo = await product.find({ _id: { $ne: productId }, [categories]: type }).sort({rate: -1}).lean().limit(5)
      if (!productInfo) return res.status(404).json({ error: "No products found" })
      
      return res.json({data: productInfo})
      
    } catch (error) {
      return res.json({error: error})
    }
  }

  async getRelatedBrand(req, res, next) {
    try {
      const productId = req.body.productId
      const brand = req.body.brand
      const productInfo = await product.find({ _id: { $ne: productId }, brand: brand }).sort({rate: -1}).lean().limit(5)
      if (!productInfo) return res.status(404).json({ error: "No products found" })
      
      return res.json({data: productInfo})
      
    } catch (error) {
      return res.json({error: error})
    }
  }
  
  async getRelatedViewed(req, res, next) {
    try {
      const userId = req.cookies.uid
      if (!userId) return res.json({ data: [] })

      const productId = req.body.productId
      const userViews = await userView
        .find({
          userId: userId,
          productId: { $ne: productId }
        })
        .sort({ lastViewAt: -1 })
        .limit(50)
        .lean()

      const productViewedIds = userViews.map(v => v.productId)
      if (productViewedIds.length === 0) return res.json({ data: [] })

      let products = await product.find({ _id: { $in: productViewedIds } }).lean()
      const productMap = new Map(products.map(p => [String(p._id), p]))
      const orderedProducts = productViewedIds
        .map(id => productMap.get(String(id)))
        .filter(Boolean)

      return res.json({ data: orderedProducts })

    } catch (error) {
      console.log("getRelatedViewed error:", error)
      return res.status(500).json({ error: error.message })
    }
  }
  
  async getRelatedRecommend(req, res, next) {
    try {
      const productId = req.body.productId
      const categories = req.body.categories
      const type = req.body.type
      const productInfo = await product.find({ _id: { $ne: productId }, [categories]: type }).lean().limit(5)
      if (!productInfo) return res.status(404).json({ error: "No products found" })
      
      return res.json({data: productInfo})
      
    } catch (error) {
      return res.json({error: error})
    }
  }

  async getComment(req, res, next) {
    try {
      const productId = req.body.productId
      const comments = await comment.find({ productId: productId, comment: { $ne: '' } })
      if (!comments) return res.status(404).json({ error: "No comments found" })
      
      return res.json({data: comments})
      
    } catch (error) {
      return res.json({error: error})
    }
  }

  async showAllProducts(req, res, next) {
    return res.render('users/allProducts', { title: 'All Products' }) 
  }

  async productInfo(req, res, next) {
    if (!checkForHexRegExp(req.params.id)) return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
    const holderComments = Array(5).fill({})
    const holderRelatedProducts = Array(5).fill({})

    return res.render('users/detailProduct', { holderComments, holderRelatedProducts })
  }
}
module.exports = new allProductsController