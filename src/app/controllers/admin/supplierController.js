const supplier = require('../../models/supplierModel')
const purchase = require('../../models/purchaseModel')
const { ObjectId } = require('mongodb')

class allSuppliersController {
  async getSuppliers(req, res, next) {
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
        supplier
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(itemsPerPage)
          .lean(),
        supplier.find(filter).countDocuments(),
      ]) 
      if (!data) throw new Error('error')
      
      return res.json({data: data, data_size: dataSize})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async getFilter(req, res, next) {
  
  }

  async allSuppliers(req, res, next) {
    try {
      return res.render('admin/all/supplier', { title: 'Supplier List', layout: 'admin' })
    } catch (error) {
      return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' }) 
    }
  }

  async getSupplier(req, res, next) {
    try {
      const [supplierInfo, purchaseInfo] = await Promise.all([
        supplier.findOne({ _id: req.body.id }).lean(),
        purchase.find({ supplierId: req.body.id }).lean()
      ]) 
      if (!supplierInfo) throw new Error('error')
  
      return res.json({supplierInfo: supplierInfo, purchaseInfo: purchaseInfo})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async supplierUpdate(req, res, next) {
    try {
      await supplier.updateOne({ _id: req.body.id }, {
        name    : req.body.name    ,
        phone   : req.body.phone   ,
        address : req.body.address ,
      })
  
      return res.json({message: 'Updated successfully'})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async supplierCreated(req, res, next) {
    try {
      const userExist = await supplier.findOne({ phone: req.body.phone })
      if (userExist) throw new Error('Supplier already exists')
  
      const newSupplier = new supplier(req.body)
      await newSupplier.save()
      return res.json({isValid: true, message: 'Supplier created successfully'})
      
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }
}
module.exports = new allSuppliersController