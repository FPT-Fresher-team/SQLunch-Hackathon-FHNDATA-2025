const order = require('../../models/orderModel')
const user = require('../../models/userModel')
const product = require('../../models/productModel')
const orderStatus = require('../../models/orderStatusModel')
const paymentMethod = require('../../models/paymentMethodModel')
const employee = require('../../models/employeeModel')
const { ObjectId } = require('mongodb')
const nodemailer = require("nodemailer")

class allOrdersController {
  async getOrders(req, res, next) {
    try {
      const currentPage  = req.body.page
      let sort           = req.body.sort
      let filter         = req.body.filter
      const itemsPerPage = req.body.itemsPerPage
      const skip         = (currentPage - 1) * itemsPerPage
      const userInfo     = await employee.findOne({ _id: req.cookies.uid }).lean()
      if (!userInfo) throw new Error('User not found')

      if (Object.keys(sort).length === 0) {
        sort = { updatedAt: -1 }
      }

      if (filter['_id']) {
        filter['_id'] = ObjectId.createFromHexString(filter['_id'])
      }

      const [data, dataSize] = await Promise.all([
        order
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(itemsPerPage)
          .lean(),
        order.find(filter).countDocuments(),
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
      const [customers, orderStatuses, paymentMethods] = await Promise.all([
        user.find().lean(),
        orderStatus.find().sort({order: 1}).lean(),
        paymentMethod.find().lean(),
      ]) 
  
      return res.json({ customers: customers, orderStatus: orderStatuses, paymentMethod: paymentMethods})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async allOrders(req, res, next) {
    try {
      return res.render('admin/all/order', { title: 'Order List', layout: 'admin' })
    } catch (error) {
      return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' }) 
    }
  }

  async getOrder(req, res, next) {
    try {
      const [orderInfo, orderStatuses, paymentMethods, userInfo] = await Promise.all([
        order.find({ _id: req.body.id }).lean(),
        orderStatus.find().sort({name: 1}).lean(),
        paymentMethod.find().lean(),
        employee.findOne({ _id: req.cookies.uid }).lean()
      ])
      if (!orderInfo) throw new Error('Order not found')

      return res.json({orderInfo: orderInfo[0], orderStatuses: orderStatuses, paymentMethods: paymentMethods, userRole: userInfo.role})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async orderUpdate(req, res, next) {
    try {
      const updatedOrder = await order.findOneAndUpdate(
        { _id: req.body.id }, 
        { 
          status        : req.body.status,
          paymentMethod : req.body.paymentMethod,
          isPaid        : req.body.isPaid
        },
        {new: true}
      )

      if (req.body.status === 'preparing') {
        const orderInfo = await order.findOne({ _id: req.body.id }).lean()

        const bulkOps = orderInfo.products.map(({ id, quantity }) => ({
          updateOne: {
            filter: { _id: id },
            update: [
              {
                $set: {
                  quantity: { $subtract: ["$quantity", quantity] },
                  saleNumber: { $add: ["$saleNumber", quantity] },
                  status: {
                    $cond: [
                      { $eq: [{ $subtract: ["$quantity", quantity] }, 0] },
                      "out-of-order",
                      "$status"
                    ]
                  }
                }
              }
            ],
            upsert: true,
          },
        }))
        await product.bulkWrite(bulkOps)
      }

      console.log(req.body.status === 'delivered', req.body.isPaid === true)

      if (req.body.status === 'delivered' && req.body.isPaid === true) {
        const orderInfo = await order.findOne({ _id: req.body.id }).lean()
        const userId = orderInfo.customerInfo.userId

        if (userId !== 'guest') {
          const userInfo = await user.findOne({ _id: userId }).lean()
          const userEmail     = userInfo.email
          const adminEmail    = process.env.ADMIN_EMAIL
          const adminPassword = process.env.GOOGLE_APP_EMAIL
    
          const transporter = nodemailer.createTransport({
            service: "gmail",
            secure: false, // true for port 465, false for other ports
            auth: {
              user: adminEmail,
              pass: adminPassword,
            },
          })

          async function sendEmail(userEmail) {
            await transporter.sendMail({
              from: adminEmail,
              to: userEmail,
              subject: `Order ${req.body.id} has delivered successfully`, 
              html: `
                Please click here to confirm received your order
                <button><a target="_blank" rel="noopener noreferrer" href="http://localhost:3000/all-orders/order/done?id=${req.body.id}&email=${userEmail}">Received order</a></button>
              `,
            })
          }

          await sendEmail(userEmail)
        }
      }

      if (req.body.status === 'cancel') {
        const orderInfo = await order.findOne({ _id: req.body.id }).lean()
        const userId = orderInfo.customerInfo.userId
  
        // update product quantity
        const productInfo = orderInfo.products.map(product => ({id: product.id, quantity: product.quantity}))
        const bulkOps = productInfo.map(({ id, quantity }) => ({
          updateOne: {
            filter: { _id: id },
            update: { $inc: { quantity: +quantity, saleNumber: -quantity }}, 
            upsert: true,
          },
        }))
        await product.bulkWrite(bulkOps)
  
        if(userId !== 'guest') {
          await user.updateOne({ _id: userId }, {
            $inc: { 
              revenue: -orderInfo.totalOrderPrice,
              quantity: -1
            }
          })
        }
      }

      if (req.body.status === 'done') {
        const orderInfo = await order.findOne({ _id: req.body.id }).lean()
        const userId = orderInfo.customerInfo.userId
        
        const silver  = 1000000
        const gold    = 2000000
        const diamond = 4000000

        if(userId !== 'guest') {
          const userInfo = await user.findOne({ _id: userId }).lean()
          if (userInfo.revenue >= diamond) {
            await user.updateOne({ _id: userId }, {
              $set: { memberCode: 'diamond' }
            })
          }
          else if (userInfo.revenue >= gold) {
            await user.updateOne({ _id: userId }, {
              $set: { memberCode: 'gold' }
            })
          }
          else if (userInfo.revenue >= silver) {
            await user.updateOne({ _id: userId }, {
              $set: { memberCode: 'silver' }
            })
          }
          await user.updateOne({ _id: userId }, {
            $inc: { 
              revenue: orderInfo.totalNewOrderPrice,
              quantity: 1
            }
          })
        }
      }
  
      return res.json({message: 'Updated successfully'})
    } catch (error) {
      return res.json({error: error.message})
    }
  }
  
  async getProducts(req, res, next) {
    try {
      const query = req.body.query
      const products = await product.find({
        deletedAt: null,
        status: { $ne: 'out-of-order' },
        name: { $regex: query, $options: 'i'}
      }).lean()
      return res.json({data: products})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async orderCreated(req, res, next) {
    try {
      const { 
        orderDate, 
        userId,
        paymentMethod,
        note,
        productId, 
        productName,
        productImg,
        productPrice,
        productQuantity,
        totalOrderPrice
      } = req.body
  
      // if the req.body has only 1 record, convert 1 record to array
      if(!Array.isArray(productId)) {
        productId       = [productId]
        productName     = [productName]
        productImg      = [productImg]
        productPrice    = [productPrice]
        productQuantity = [productQuantity]
      }
  
      const userInfo = await user.findOne({ _id: userId }).lean()
  
      const newOrder = new order({
        products: productId.map((product, index) => ({
          id        : productId[index],
          name      : productName[index],
          image     : productImg[index],
          price     : productPrice[index],
          quantity  : productQuantity[index], 
          totalPrice: productPrice[index] * productQuantity[index]
        })),
        customerInfo: {
          userId  : userId,
          name    : userInfo.name,
          phone   : userInfo.phone,
          address : userInfo.address,
          note    : note
        },
        paymentMethod     : paymentMethod,
        createdAt         : orderDate,
        totalOrderPrice   : totalOrderPrice,
        totalNewOrderPrice: totalOrderPrice
      });
      const savedOrder = await newOrder.save()

      // try {
      //   await producer.connect()
      //   await producer.send({
      //     topic: 'create',
      //     messages: [{ value: JSON.stringify({
      //       topic_type: 'order',
      //       emp_id: req.cookies.uid,
      //       body: savedOrder
      //     })}],
      //   })
      // } catch (error) {
      //   console.log(error)
      // }
      
      return res.json({message: 'Created successfully'})
    } catch (error) {
      return res.json({error: error.message})
    }
  }
}
module.exports = new allOrdersController