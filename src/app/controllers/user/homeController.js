const product = require('../../models/productModel')
const voucher = require('../../models/voucherModel')
const brand = require('../../models/brandModel')
const user = require('../../models/userModel')
const notification = require('../../models/notificationModel')
const employee = require('../../models/employeeModel')
const kafka = require("kafkajs").Kafka
const kafkaClient = new kafka({ brokers: ["localhost:9092"] })
const producer = kafkaClient.producer()

class homeController {
  async getVouchers(req, res, next) {
    try {
      const userInfo = await user.findOne({ _id: req.cookies.uid }).lean()
      const userMember = userInfo.memberCode
      const data = await voucher.find({memberCode: userMember, status: 'active' }).lean()
      return res.json({data: data})
    } catch (error) {
      return res.json({error: error.message})
    }
  }
  
  async getProducts(req, res, next) {
    try {
      const data      = await product.find({ deletedAt: null }).lean()
      const flashSale = data.filter(item => item.status === 'flash-sale').slice(0, 5)
      const hotSale   = data.filter(item => item.status === 'hot').slice(0, 5)
      const topSale   = data.sort((a, b) => b.saleNumber - a.saleNumber).slice(0, 5)
      const skincare  = data.filter(item => item.categories === 'skincare').slice(0, 5)
      const makeup    = data.filter(item => item.categories === 'makeup').slice(0, 5)
      const all       = data.slice(0, 5)

      return res.json({
        flashSale : flashSale,
        hotSale   : hotSale,
        topSale   : topSale,
        skincare  : skincare,
        makeup    : makeup,
        all       : all
      })
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }
  
  async getOutOfOrderProducts(req, res, next) {
    try {
      const data = await product.find({ status: 'out-of-order' }).lean()
      return res.json({data: data})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async getOrderProducts(req, res, next) {
    try {
      const productIds = req.body.productIds
      const data = await product.find({ _id: { $in: productIds } }).lean()
      return res.json({data: data})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async getUsers(req, res, next) {
    try {
      const userId = req.cookies.uid || ''
      if (!userId) return res.json({message: false})
      
      const userInfo = await user.findOne({ _id: userId }).lean()
      if (!userInfo) return res.json({message: false})
      
      return res.json({message: true, uid: userId, data: userInfo})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async getBrands(req, res, next) {
    try {
      const data = await brand.find().lean()
      return res.json({data: data})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async show(req, res, next) {
    return res.render('users/home', { title: 'BEAUTÉ - Inspired by nature' })
  }

  async searchInfo(req, res, next) {
    try {
      const query = req.body.query
      const data = await product.find({
        $or: [
          { name: { $regex: query, $options: 'i'} },
          { brand: { $regex: query, $options: 'i'}}
        ]
      }).lean()
      return res.json({data: data})
    } catch (error) {
      return res.json({error: error.message})
    }
  }
  
  async setNotification(req, res, next) {
    try {
      const {message, type, userId} = req.body

      if (type === 'order') {
        const employees = await employee.find().lean()
        const employeeIDs = employees.map(employee => employee._id)

        for (const id of employeeIDs) {
          const newNotification = new notification({
            message   : message,
            receiverId: id,
            isRead    : false,
            type      : type,
          });
          await newNotification.save();
        }
      }

      if (type === 'message') {
        const userInfo = await user.findOne({_id: userId}).lean()

        const newNotification = new notification({
          message   : `${userInfo.name}: ${message}`,
          receiverId: process.env.ADMIN_ID,
          isRead    : false,
          type      : type,
        });
        await newNotification.save()
      }
      
      return res.json({isValid: true, message: 'Thêm thông báo thành công'})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }
  
  async streamingKafka(req, res, next) {
    try {
      const { topic, value } = req.body

      // await producer.connect()
      // await producer.send({
      //   topic: topic,
      //   messages: [{ value: JSON.stringify(value) }],
      // })

    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }
}
module.exports = new homeController