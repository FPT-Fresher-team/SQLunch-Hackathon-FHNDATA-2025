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
      const flashSale = data.filter(item => item.isFlashDeal === true).slice(0, 5)
      const topSale   = data.filter(item => item.isTopSelling === true).slice(0, 5)
      const newArrival= data.filter(item => item.isNewArrival === true).slice(0, 5)
      const all       = data.slice(0, 5)

      return res.json({
        flashSale : flashSale   || [],
        topSale   : topSale     || [],
        newArrival: newArrival  || [],
        all       : all || []
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
      const searchQuery = req.body.searchQuery
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
      ]

      const data = await product.aggregate(pipeline)
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
      
      return res.json({isValid: true, message: 'Add notification successfully'})
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

  async testCDC(req, res, next) {
    try {
      // Simulate CDC event handling here
      console.log("CDC test endpoint hit");
      console.log(req.body)
      return res.json({message: 'CDC test successful'});
    } catch (error) {
      console.log(error)
      return res.json({message: error.message})
    }
  }
}
module.exports = new homeController