require('dotenv').config()
const employee = require('../../models/employeeModel')
const user = require('../../models/userModel')
const chat = require('../../models/chatModel')
const order = require('../../models/orderModel')
const member = require('../../models/memberModel')
const bcrypt = require('bcryptjs')
const checkForHexRegExp = require('../../middleware/checkForHexRegExp')
const kafka = require("kafkajs").Kafka
const kafkaClient = new kafka({ brokers: ["localhost:9092"] })
const producer = kafkaClient.producer()
const { ObjectId } = require('mongodb')

class allCustomersController {
  async getCustomers(req, res, next) {
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
        user
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(itemsPerPage)
          .lean(),
          user.find(filter).countDocuments(),
      ]) 
      if (!data) throw new Error('Data not found')
      
      return res.json({data: data, data_size: dataSize})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async getFilter(req, res, next) {
    try {
      const memberShip = await member.find().lean()
      if (!memberShip) throw new Error('error')
      return res.json({memberShip: memberShip})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async allCustomers(req, res, next) {
    try {
      return res.render('admin/all/customer', { title: 'All Customers', layout: 'admin' })
    } catch (error) {
      return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
    }
  }

  async getCustomer(req, res, next) {
    try {
      const customerInfo = await user.findOne({ _id: req.body.id }).lean()
      if (!customerInfo) throw new Error('error')

      const [memberInfo, orderInfo] = await Promise.all([
        member.findOne({ code: customerInfo.memberCode}).lean(),
        order.aggregate([
          {
            $match: { 'customerInfo.userId': req.body.id }
          },
          {
            $lookup: {
              from: 'orderStatuses',
              localField: 'status',
              foreignField: 'code',
              as: 'orderStatus'
            }
          },
          {
            $lookup: {
              from: 'paymentMethods',
              localField: 'paymentMethod',
              foreignField: 'code',
              as: 'paymentMethod'
            }
          },
          {
            $unwind: '$orderStatus'
          },
          {
            $unwind: '$paymentMethod'
          }
        ])
      ])
      
      return res.json({customerInfo: customerInfo, memberInfo: memberInfo, orderInfo: orderInfo})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async customerUpdate(req, res, next) {
    try {
      const updatedUser = await user.findOneAndUpdate(
        { _id: req.body.id }, 
        {
          $set: {
            name   : req.body.name    ,
            phone  : req.body.phone   ,
            address: req.body.address ,
            gender : req.body.gender  ,
            dob    : req.body.dob
          }
        },
        {new: true}
      )

      // try {
      //   await producer.connect()
      //   await producer.send({
      //     topic: 'update',
      //     messages: [{ value: JSON.stringify({
      //       topic_type: 'customer',
      //       emp_id: req.cookies.uid,
      //       body: updatedUser
      //     })}],
      //   })
      // } catch (error) {
      //   console.log(error)
      // }

      return res.json({message: 'Update successfully'})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async customerCreated(req, res, next) {
    try {
      const userExist = await user.findOne({ email: req.body.email })
      if (userExist) throw new Error('Email already exists')

      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(req.body.password, salt)

      const newUser = new user({
        email   : req.body.email,
        password: hashedPassword,
        role    : 'user',
        name    : req.body.name,
        phone   : req.body.phone,
        address : req.body.address,
        dob     : req.body.dob
      })
      const savedUser = await newUser.save()

      const adminId = process.env.ADMIN_ID
      const newChat = new chat({
        adminId: adminId,
        userId: savedUser._id
      })
      await newChat.save()

      // try {
      //   await producer.connect()
      //   await producer.send({
      //     topic: 'create',
      //     messages: [{ value: JSON.stringify({
      //       topic_type: 'customer',
      //       emp_id: req.cookies.uid,
      //       body: savedUser
      //     })}],
      //   })
      // } catch (error) {
      //   console.log(error)
      // }
      
      return res.json({isValid: true, message: 'Create account successfully'})
    } catch (error) {
      return res.json({error: error.message})
    }
  }
}
module.exports = new allCustomersController