const product = require('../../models/productModel')
const purchase = require('../../models/purchaseModel')
const supplier = require('../../models/supplierModel')
const store = require('../../models/storeModel')
const employee = require('../../models/employeeModel')
const { ObjectId } = require('mongodb')

class adminController {
  async getPurchases(req, res, next) {
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

      const userInfo = await employee.findOne({ _id: req.cookies.uid }).lean()
      if (!userInfo) throw new Error('User not found')
  
      const [data, dataSize] = await Promise.all([
        purchase
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(itemsPerPage)
          .lean(),
        purchase.find(filter).countDocuments(),
      ]) 
      if (!data) throw new Error('Data not found')
      
      return res.json({data: data, data_size: dataSize})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async getFilter(req, res, next) {
    try {
      const stores = await store.find().lean()
      return res.json({ store: stores })
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async allPurchases(req, res, next) {
    try {
      return res.render('admin/all/purchase', { title: 'Purchase List', layout: 'admin' })
    } catch (error) {
      return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' }) 
    }
  }

  async getPurchase(req, res, next) {
    try {
      const purchaseInfo = await purchase.findOne({ _id: req.body.id }).lean()
      if (!purchaseInfo) throw new Error('error')
  
      const supplierInfo = await supplier.findOne({ _id: purchaseInfo.supplierId}).lean()
      if (!supplierInfo) throw new Error('error')
      
      return res.json({purchaseInfo: purchaseInfo, supplierInfo: supplierInfo})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async purchaseUpdate(req, res, next) {

  }

  async getSuppliers(req, res, next) {
    try {
      const suppliers = await supplier.find().lean()
      return res.json({data: suppliers})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async getProducts(req, res, next) {
    try {
      const query = req.body.query
      const products = await product.find({
        deletedAt: null,
        name: { $regex: query, $options: 'i'}
      }).lean()
      return res.json({data: products})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async purchaseCreated(req, res, next) {
    try {
      let { 
        purchaseDate, 
        supplierId,
        note,
        productId, 
        productName,
        productImg,
        productPrice,
        productQuantity,
        totalPurchasePrice
      } = req.body
  
      // if the req.body has only 1 record, convert 1 record to array
      if(!Array.isArray(productId)) {
        productId       = [productId]
        productName     = [productName]
        productImg      = [productImg]
        productPrice    = [productPrice]
        productQuantity = [productQuantity]
      }
  
      const newPurchase = new purchase({
        products: productId.map((product, index) => ({
          id        : productId[index],
          name      : productName[index],
          image     : productImg[index],
          price     : productPrice[index],
          quantity  : productQuantity[index], 
          totalPrice: productPrice[index] * productQuantity[index]
        })),
        supplierId: supplierId,
        note: note,
        purchaseDate: purchaseDate,
        totalProducts: productQuantity.reduce((acc, curr) => acc + parseInt(curr), 0),
        totalPurchasePrice: totalPurchasePrice
      });
      await newPurchase.save()
  
      const productUpdates = []
      productId.forEach((id, index) => {
        productUpdates.push({ productId: id, quantity: productQuantity[index] })
      })
      
      await supplier.updateOne({ _id: supplierId }, {
        $inc: { 
          totalCost: totalPurchasePrice,
          quantity: 1
         }
      })
  
      const bulkOps = productUpdates.map(({ productId, quantity }) => ({
        updateOne: {
          filter: { _id: productId },
          update: { $inc: { quantity: quantity } }, 
          upsert: true,
        },
      }))
      await product.bulkWrite(bulkOps)

      return res.json({message: 'Created successfully'})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }
}
module.exports = new adminController