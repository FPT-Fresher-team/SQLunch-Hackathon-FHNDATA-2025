require('dotenv').config()
const product = require('../../models/productModel')
const brand = require('../../models/brandModel')
const productStatus = require('../../models/productStatusModel')
const cloudinary = require('cloudinary').v2
const { ObjectId } = require('mongodb')

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key   : process.env.API_KEY,
  api_secret: process.env.API_SECRET,
})

class allProductsController {
  async getProducts(req, res, next) {
    try {
      const currentPage  = Number(req.body.page) || 1
      const itemsPerPage = Number(req.body.itemsPerPage) || 10
      const skip         = (currentPage - 1) * itemsPerPage
      let sort           = req.body.sort || {}
      let filter         = req.body.filter || {}

      const searchQuery  = req.body.searchQuery?.trim()
      const isSearchMode = !!searchQuery

      let data = []
      let dataSize = 0

      if (isSearchMode) {
        const pipeline = [
          {
            $search: {
              index: 'product_index',                   
              text: {
                query: searchQuery,
                path: [
                  'name',    
                ],
                fuzzy: {
                  maxEdits: 2,           // allow up to 2 typos (e.g. "jhon" → "john")
                  prefixLength: 1        // first letter must be correct
                }
              }
            }
          },
          { $skip: skip },
          // { $limit: itemsPerPage },
        ]

        const result = await product.aggregate(pipeline)

        data = result
        dataSize = result.length

      } else {
        // NORMAL MODE
        if (Object.keys(sort).length === 0) sort = { updatedAt: -1 }

        if (filter._id?.$regex) {
          try {
            filter._id = mongoose.Types.ObjectId.createFromHexString(filter._id.$regex)
          } catch (e) { delete filter._id }
        }

        const [result, total] = await Promise.all([
          product.find(filter).sort(sort).skip(skip).limit(itemsPerPage).lean(),
          product.countDocuments(filter)
        ])

        data = result
        dataSize = total
      }

      return res.json({ data: data, data_size: dataSize })
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async getDeletedProducts(req, res, next) {
    try {
      const currentPage  = req.body.page
      const itemsPerPage = 10
      const skip         = (currentPage - 1) * itemsPerPage
  
      const [data, dataSize] = await Promise.all([
        product
          .find({ deletedAt: { $ne: null }})
          .skip(skip)
          .limit(itemsPerPage)
          .lean(),
        product.find({ deletedAt: { $ne: null }}).countDocuments(),
      ]) 
      if (!data) throw new Error('Data not found')
      
      return res.json({data: data, data_size: dataSize})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async getFilter(req, res, next) {
    try {
      const brands = await brand.find().lean()
      return res.json({brand: brands})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async allProducts(req, res, next) {
    try {
      return res.render('admin/all/product', { title: 'Product List', layout: 'admin' })
    } catch (error) {
      return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
    }
  }

  async trash(req, res, next) {
    try {
      return res.render('admin/all/trash', { title: 'Products Deleted', layout: 'admin' })
    } catch (error) {
      return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
    }
  }

  async getProduct(req, res, next) {
    try {
      const [productInfo, brands, productStatuses] = await Promise.all([
        product.findOne({ _id: req.body.id }).lean(),
        brand.find().lean(),
        productStatus.find().lean()
      ]) 
      if (!productInfo) throw new Error('Product not found')
  
      return res.json({productInfo: productInfo, brands: brands, productStatuses: productStatuses})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async productUpdated(req, res, next) {  
    try {
      function deFormatNumber(number) {
        return parseInt(number.toString().replace(/\./g, ''))
      }
  
      const updatedProduct = await product.findOneAndUpdate(
        { _id: req.body.id },
        {
          $set: {
            categories    : req.body.categories,
            subcategories : req.body.subcategories,
            brand         : req.body.brand,
            name          : req.body.name,
            purchasePrice : deFormatNumber(req.body.purchasePrice),
            oldPrice      : deFormatNumber(req.body.oldPrice),
            price         : deFormatNumber(req.body.price),
            description   : req.body.description,
            details       : req.body.details,
            guide         : req.body.guide,
            quantity      : req.body.quantity,
            status        : req.body.status,
            isFlashDeal   : req.body.isFlashDeal,
            isNewArrival  : req.body.isNewArrival,
          }
        },
        { new: true }
      )
  
      return res.json({message: 'Updated successfully'})
    } catch (error) {
      return res.json({error: error.message})
    }  
  }

  async softDelete(req, res, next) {
    try {
      await product.updateOne({ _id: req.body.id}, { deletedAt: Date.now() })
      return res.json({isValid: true, message: 'Deleted successfully'})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const newProduct = await product.findOne({ _id: req.body.id })
      const deleteImg = newProduct.img.filename
      
      await cloudinary.uploader.destroy(deleteImg)
      await product.deleteOne({ _id: req.body.id })
  
      return res.json({isValid: true, message: 'Move product to trash successfully'})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async restore(req, res, next) {
    try {
      await product.updateOne({ _id: req.body.id}, { deletedAt: null })
      return res.json({message: 'Restore product successfully'})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async productCreated(req, res, next) {
    try {
      const result = await cloudinary.uploader.upload(req.body.img, {
        folder: 'products',
        use_filename: true
      })
  
      const newProduct = new product({
        categories    : req.body.categories,
        subcategories : req.body.subcategories,
        brand         : req.body.brand,
        name          : req.body.name,
        oldPrice      : req.body.oldPrice,
        purchasePrice : req.body.purchasePrice,
        price         : req.body.price,
        description   : req.body.description,
        details       : req.body.details,
        guide         : req.body.guide,
        quantity      : req.body.quantity,
        'img.path'    : result.secure_url,
        'img.filename' : result.public_id
      })
      const savedProduct = await newProduct.save()

      return res.json({isValid: true, message: 'Created successfully'})
    } catch (error) {
      return res.json({error: error.message})
    }
  }
}
module.exports = new allProductsController