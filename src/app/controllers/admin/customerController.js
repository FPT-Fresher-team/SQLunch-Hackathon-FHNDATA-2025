require('dotenv').config()
const user = require('../../models/userModel')
const chat = require('../../models/chatModel')
const order = require('../../models/orderModel')
const member = require('../../models/memberModel')
const bcrypt = require('bcryptjs')

class allCustomersController {
  async getCustomers(req, res, next) {
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
              index: 'customer',                   
              text: {
                query: searchQuery,
                path: [
                  'name',        // search in name
                  'email',       // search in email
                  'phone',       // search in phone
                  'address'      // search in address
                ],
                fuzzy: {
                  maxEdits: 2,           // allow up to 2 typos (e.g. "jhon" → "john")
                  prefixLength: 1        // first letter must be correct
                }
              }
            }
          },
          { $skip: skip },
          { $limit: itemsPerPage },
        ]

        const countPipeline = [
          { $search: { index: "customer", text: { query: searchQuery, path: ["name", "email", "phone", "address"] } } },
          { $count: "total" }
        ]

        const [result, countResult] = await Promise.all([
          user.aggregate(pipeline),
          user.aggregate(countPipeline)
        ])

        data = result
        dataSize = countResult[0]?.total || 0

      } else {
        // NORMAL MODE
        if (Object.keys(sort).length === 0) sort = { updatedAt: -1 }

        if (filter._id?.$regex) {
          try {
            filter._id = mongoose.Types.ObjectId.createFromHexString(filter._id.$regex)
          } catch (e) { delete filter._id }
        }

        const [result, total] = await Promise.all([
          user.find(filter).sort(sort).skip(skip).limit(itemsPerPage).lean().select('-password'),
          user.countDocuments(filter)
        ])

        data = result
        dataSize = total
      }

      return res.json({ data, data_size: dataSize })

    } catch (error) {
      console.error('getCustomers error:', error)
      return res.status(500).json({ error: error.message })
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