require('dotenv').config()
const product = require('../../models/productModel')
const brand = require('../../models/brandModel')
const productStatus = require('../../models/productStatusModel')
const cloudinary = require('cloudinary').v2
const checkForHexRegExp = require('../../middleware/checkForHexRegExp')
const kafka = require("kafkajs").Kafka
const kafkaClient = new kafka({ brokers: ["localhost:9092"] })
const producer = kafkaClient.producer()
const { ObjectId } = require('mongodb')

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key   : process.env.API_KEY,
  api_secret: process.env.API_SECRET,
})

class allProductsController {
  async getProducts(req, res, next) {
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
        product
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(itemsPerPage)
          .lean(),
        product.find(filter).countDocuments(),
      ]) 
      if (!data) throw new Error('Data not found')
      
      return res.json({data: data, data_size: dataSize})
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
      return res.render('admin/all/product', { title: 'Danh sách sản phẩm', layout: 'admin' })
    } catch (error) {
      return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
    }
  }

  async trash(req, res, next) {
    try {
      return res.render('admin/all/trash', { title: 'Kho', layout: 'admin' })
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
            skincare      : req.body.skincare,
            makeup        : req.body.makeup,
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
          }
        },
        { new: true }
      )

      // try {
      //   await producer.connect()
      //   await producer.send({
      //     topic: 'update',
      //     messages: [{ value: JSON.stringify({
      //       topic_type: 'product',
      //       emp_id: req.cookies.uid,
      //       body: updatedProduct
      //     })}],
      //   })
      // } catch (error) {
      //   console.log(error)
      // }
  
      return res.json({message: 'Cập nhật thông tin thành công'})
    } catch (error) {
      return res.json({error: error.message})
    }  
  }

  async softDelete(req, res, next) {
    try {
      await product.updateOne({ _id: req.body.id}, { deletedAt: Date.now() })
      return res.json({isValid: true, message: 'Xoá sản phẩm thành công'})
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
  
      return res.json({isValid: true, message: 'Xoá sản phẩm thành công'})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async restore(req, res, next) {
    try {
      await product.updateOne({ _id: req.body.id}, { deletedAt: null })
      return res.json({message: 'Khôi phục sản phẩm thành công'})
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
        categories  : req.body.categories,
        skincare    : req.body.skincare,
        makeup      : req.body.makeup,
        brand       : req.body.brand,
        name        : req.body.name,
        oldPrice    : req.body.oldPrice,
        purchasePrice : req.body.purchasePrice,
        price       : req.body.price,
        description : req.body.description,
        details     : req.body.details,
        guide       : req.body.guide,
        quantity    : req.body.quantity,
        status      : req.body.status,
        'img.path'  : result.secure_url,
        'img.filename' : result.public_id
      })
      const savedProduct = await newProduct.save()

      return res.json({isValid: true, message: 'Tạo sản phẩn mới thành công'})
    } catch (error) {
      return res.json({error: error.message})
    }
  }
}
module.exports = new allProductsController