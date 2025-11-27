const brand = require('../../models/brandModel')
const product = require('../../models/productModel')

class allBrandsController {
  async getBrands(req, res, next) {
    try {
      const currentPage  = req.body.page
      let sort           = req.body.sort
      let filter         = req.body.filter
      const itemsPerPage = req.body.itemsPerPage
      const skip         = (currentPage - 1) * itemsPerPage

      if (Object.keys(sort).length === 0) {
        sort = { updatedAt: -1 }
      }

      if (filter['_id']) {
        filter['_id'] = ObjectId.createFromHexString(filter['_id'])
      }

      const [data, dataSize] = await Promise.all([
        brand
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(itemsPerPage)
          .lean(),
        brand.find(filter).countDocuments(),
      ]) 
      if (!data) throw new Error('Data not found')
      return res.json({data: data, data_size: dataSize})
    } catch (error) {
      console.log(error)
      return res.json({error: error})
    }
  }

  async getFilter(req, res, next) {
  
  }
  
  async allBrands(req, res, next) {
    try {
      return res.render('admin/all/brand', { title: 'Brand List', layout: 'admin' })
    } catch (error) {
      console.log(error)
      return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' }) 
    }
  }

  async getBrand(req, res, next) {
    try {
      const brandInfo = await brand.findOne({ _id: req.body.id }).lean()
      if (!brandInfo) throw new Error('error')
  
      const productsInfo = await product.find({ brand: brandInfo.name }).lean()
  
      res.json({brandInfo: brandInfo, productsInfo: productsInfo})
    } catch (error) {
      return res.json({error: error})
    }
  }

  async brandUpdate(req, res, next) {

  }

  async brandCreated(req, res, next) {

  }
}
module.exports = new allBrandsController