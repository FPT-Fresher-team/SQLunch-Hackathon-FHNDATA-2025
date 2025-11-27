require('dotenv').config()
const order = require('../../models/orderModel')
const user = require('../../models/userModel')
const store = require('../../models/storeModel')
const product = require('../../models/productModel')
const comment = require('../../models/commentModel')
const orderStatus = require('../../models/orderStatusModel')
const paymentMethod = require('../../models/paymentMethodModel')
const voucher = require('../../models/voucherModel')
const userVoucher = require('../../models/userVoucherModel')
const checkForHexRegExp = require('../../middleware/checkForHexRegExp')
const cloudinary = require('cloudinary').v2
const kafka = require("kafkajs").Kafka
const kafkaClient = new kafka({ brokers: ["localhost:9092"] })
const producer = kafkaClient.producer()
const crypto = require('crypto')
const https = require('https')
const nodemailer = require("nodemailer")

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key   : process.env.API_KEY,
  api_secret: process.env.API_SECRET,
})

class allOrderController {
  async getOrder(req, res, next) {
    try {
      const orderInfo = await order.findOne({ _id: req.body.id }).lean()
      if (!orderInfo) return res.json({message: 'order not found'})
      
      const status = await orderStatus.findOne({ code: orderInfo.status })
      const method = await paymentMethod.findOne({ code: orderInfo.paymentMethod })

      return res.json({data: orderInfo, status: status, method: method})

    } catch (error) {
      return res.json({error: error})
    }
  }

  async getRatedOrder(req, res, next) {
    try {
      const orderInfo = await order.findOne({ _id: req.body.id }).lean()
      const comments = await comment.find({ orderId: req.body.id }).lean()
      const status = await orderStatus.findOne({ code: orderInfo.status }).lean()

      // ✅ Safe merge products with comments
      const orderWithComments = {
        ...orderInfo,
        products: orderInfo.products.map(product => {
          const cmt = comments.find(c => String(c.productId) === String(product.id))
          return {
            ...product,
            comment: cmt ? cmt.comment : null,
            rate: cmt ? cmt.rate : null
          }
        })
      }

      if (!orderInfo) return res.json({message: 'order not found'})

      return res.json({data: orderWithComments, status: status})
    } catch (error) {
      return res.json({error: error})
    }
  }
  
  async getVoucher(req, res, next) {
    try {
      const userInfo = await user.findOne({ _id: req.cookies.uid }).lean()
      if (!userInfo) throw new Error('User not found') 

      const voucherInfo = await voucher.findOne({ code: req.body.voucherCode, status: 'active', memberCode: userInfo.memberCode }).lean()
      const userVoucherInfo = await userVoucher.findOne({ code: req.body.voucherCode, status: 'active', userId: req.cookies.uid }).lean()
      if (!voucherInfo && !userVoucherInfo) throw new Error('Voucher not found')

      if (voucherInfo) return res.json({voucherInfo: voucherInfo, discountType: 'percentage'})
      if (userVoucherInfo) return res.json({voucherInfo: userVoucherInfo, discountType: 'value'})

    } catch (error) {
      return res.json({error: error.message})
    }
  }
  
  async getAllVouchers(req, res, next) {
    try {
      const userInfo = await user.findOne({ _id: req.cookies.uid }).lean()
      if (!userInfo) throw new Error('Please log in to view your vouchers!')

      const voucherInfo = await voucher.find({ memberCode: userInfo.memberCode, status: 'active' }).lean()
      const userVoucherInfo = await userVoucher.find({ status: 'active', userId: req.cookies.uid }).lean()

      return res.json({voucherInfo: voucherInfo || [], userVoucherInfo: userVoucherInfo || []})
    } catch (error) {
      return res.json({error: error.message})
    }
  }
  
  async show(req, res, next) {
    return res.render('users/allOrders', { title: 'Orders' })
  }

  async orderInfo(req, res, next) {
    try {
      const id = req.cookies.uid || null
      // if (!id) return res.render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
      
      const orderInfo = await order.findOne({ _id: req.params.id }).lean()
      if (!orderInfo) return res.render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
      if (orderInfo.customerInfo.userId === 'guest') return res.render('users/detailOrder', { title: 'Order of Guest' })

      const userInfo = await user.findOne({ _id: orderInfo.customerInfo.userId }).lean()
      if (!userInfo) return res.render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })

      if (userInfo._id.toString() !== id ) return res.render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })

      return res.render('users/detailOrder', { title: `Order of ${orderInfo.customerInfo.name}` })

    } catch (error) {
      return res.render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
    }
  }

  async ordersChecking(req, res, next) {
    return res.render('users/ordersChecking', { title: 'Checking Orders' })
  }

  async createOrders(req, res, next) {
    try {
      const result = req.body.img
        ? await cloudinary.uploader.upload(req.body.img, { folder: 'bills', use_filename: true })
        : { secure_url: '' }

      const { 
        productInfo,
        paymentMethod,
        code,
        ...customerInfo 
      } = req.body

      const note = req.body.img ? `${customerInfo.note}, ${result.secure_url}` : customerInfo.note
  
      let totalOrderPrice = 0
  
      const productIds = productInfo.map(item => item.id)
      const products = await product.find({ _id: { $in: productIds }, status: { $ne: 'out-of-order' } }).lean()
      const finalProductInfo = productInfo.map(cartItem => {
        const product = products.find(p => p._id.toString() === cartItem.id)
        if (!product) return null
  
        totalOrderPrice += product.price * cartItem.quantity
    
        return {
          id        : cartItem.id,
          image     : product.img.path,
          name      : product.name,
          price     : product.price,
          quantity  : cartItem.quantity,
          totalPrice: product.price * cartItem.quantity
        }
      }).filter(Boolean)

      let totalNewOrderPrice = totalOrderPrice

      const newOrder = new order({
        products: finalProductInfo.map((product, index) => ({
          id        : product.id,   
          image     : product.image,
          name      : product.name,
          price     : product.price,
          quantity  : product.quantity,
          totalPrice: product.totalPrice
        })),
        customerInfo: {
          userId  : customerInfo.userId,
          name    : customerInfo.name,
          phone   : customerInfo.phone,
          address : customerInfo.address,
          note    : note
        },
        voucherCode: code,
        totalOrderPrice: totalOrderPrice,
        totalNewOrderPrice: totalNewOrderPrice,
        paymentMethod: paymentMethod
      })

      if (customerInfo.userId !== 'guest') {
        const userInfo = await user.findOne({ _id: req.cookies.uid }).lean()
        if (!userInfo) throw new Error('User not found') 

        if (code !== '') {
          const voucherInfo = await voucher.findOne({ code: code, status: 'active', memberCode: userInfo.memberCode }).lean()
          const userVoucherInfo = await userVoucher.findOne({ code: code, status: 'active', userId: req.cookies.uid }).lean()
          if (!voucherInfo && !userVoucherInfo) throw new Error('Voucher not found')
            
          if (voucherInfo) {
            var discountValue = (totalOrderPrice * voucherInfo.discount) / 100
            if (discountValue > voucherInfo.maxDiscount) discountValue = voucherInfo.maxDiscount
            
            totalNewOrderPrice = totalOrderPrice - discountValue
          }
          if (userVoucherInfo) {
            totalNewOrderPrice = totalOrderPrice - userVoucherInfo.discount
          }

          newOrder.totalNewOrderPrice = totalNewOrderPrice

          if (totalNewOrderPrice >= 500000) {
            const newUserVoucher = new userVoucher({
              userId      : userInfo._id,
              orderId     : newOrder._id,
              code        : `${userInfo.slug}_${newOrder._id}`,
              description : 'Voucher for next order',
              discount    : Math.min(totalNewOrderPrice * 0.1, 500000),
              minOrder    : totalNewOrderPrice * 0.5,
              endDate     : new Date(new Date().setMonth(new Date().getMonth() + 1)),
            })
            await newUserVoucher.save()
            if (voucherInfo) {
              await voucher.updateOne({ _id: voucherInfo._id }, {
                usedCount: { $inc: 1 }
              })
            } else if (userVoucherInfo) {
              await userVoucher.updateOne({ _id: userVoucherInfo._id }, {
                usedAt: new Date(),
                status: 'used'
              })
            }
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

            function formatNumber(number) {
              return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + ' VND'
            }
    
            async function sendEmail(userEmail) {
              await transporter.sendMail({
                from: adminEmail, 
                to: userEmail, 
                subject: "Tặng bạn voucher cho lần mua tiếp theo", 
                text: `
                  Tặng bạn voucher giảm ${formatNumber(newUserVoucher.discount)} cho đơn hàng từ ${formatNumber(newUserVoucher.minOrder)} trong lần mua tiếp theo.
                  Lưu ý: voucher chỉ có hiệu lực trong vòng 1 tháng kể từ ngày nhận được.
                  Hãy copy mã voucher của bạn và sử dụng thật sớm nhé: 
                  ${newUserVoucher.code}
                `,
              })
            }
      
            await sendEmail(userInfo.email)
          }
        }
      }

      await newOrder.save()

      if (paymentMethod === 'e-wallet') {
        const accessKey = process.env.MOMO_ACCESS_KEY
        const secretKey = process.env.MOMO_SECRET_KEY
        const orderInfo = 'pay with MoMo'
        const partnerCode = 'MOMO'
        const redirectUrl = 'http://localhost:3000/all-orders/callback'
        const ipnUrl = 'http://localhost:3000/all-orders/callback'
        const requestType = "payWithMethod"
        const amount = totalNewOrderPrice
        const orderId = newOrder._id.toString()
        const requestId = orderId
        const extraData = ''
        const orderGroupId = ''
        const autoCapture = true
        const lang = 'vi'

        const rawSignature =
          "accessKey=" + accessKey +
          "&amount=" + amount +
          "&extraData=" + extraData +
          "&ipnUrl=" + ipnUrl +
          "&orderId=" + orderId +
          "&orderInfo=" + orderInfo +
          "&partnerCode=" + partnerCode +
          "&redirectUrl=" + redirectUrl +
          "&requestId=" + requestId +
          "&requestType=" + requestType

        const signature = crypto.createHmac('sha256', secretKey)
          .update(rawSignature)
          .digest('hex')

        const requestBody = JSON.stringify({
          partnerCode,
          partnerName: "Test",
          storeId: "MomoTestStore",
          requestId,
          amount,
          orderId,
          orderInfo,
          redirectUrl,
          ipnUrl,
          lang,
          requestType,
          autoCapture,
          extraData,
          orderGroupId,
          signature
        })

        const options = {
          hostname: 'test-payment.momo.vn',
          port: 443,
          path: '/v2/gateway/api/create',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody)
          }
        }

        const momoResponse = await new Promise((resolve, reject) => {
          const momoReq = https.request(options, momoRes => {
            let data = ''
            momoRes.on('data', chunk => {
              data += chunk
            })
            momoRes.on('end', () => {
              try {
                resolve(JSON.parse(data))
              } catch (err) {
                reject(err)
              }
            })
          })

          momoReq.on('error', reject)
          momoReq.write(requestBody)
          momoReq.end()
        })

        return res.json({ payUrl: momoResponse.payUrl, id: newOrder._id })
      }

      if (paymentMethod === 'transfer') {
        await order.updateOne({ _id: newOrder._id }, { status: 'preparing', isPaid: true })
        const bulkOps = finalProductInfo.map(({ id, quantity }) => ({
          updateOne: {
            filter: { _id: id },
            update: [
              {
                $set: {
                  quantity: { $subtract: ["$quantity", parseInt(quantity)] },
                  saleNumber: { $add: ["$saleNumber", parseInt(quantity)] },
                  status: {
                    $cond: [
                      { $eq: [{ $subtract: ["$quantity", parseInt(quantity)] }, 0] },
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

      return res.json({id: newOrder._id})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async createPayment(req, res, next) {
    try {
      

    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: error.message })
    }
  }

  async paymentResult(req, res, next) {
    const orderId = req.query.orderId
    const result = req.query.resultCode

    console.log(orderId)
    console.log(result)

    await order.updateOne({ _id: orderId}, {
      status: 'preparing',
      isPaid: true
    })

    return res.redirect(`/all-orders/order/${orderId}`)
  }

  async rateOrder(req, res, next) {
    try {
      const id = req.cookies.uid || null
      if (!id) return res.render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
      
      const orderInfo = await order.findOne({ _id: req.params.id }).lean()
      if (!orderInfo) return res.render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })

      const orderStatus = orderInfo.status
      if (orderStatus !== 'done') return res.render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })

      const userInfo = await user.findOne({ _id: orderInfo.customerInfo.userId }).lean()
      if (!userInfo) return res.render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })

      if (userInfo._id.toString() !== id ) return res.render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })

      res.render('users/detailRateOrder', { title: 'Rate Order' })

    } catch (error) {
      return res.render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
    }
    
  }
  
  async orderRated(req, res, next) {
    try {
      const {
        orderId,
        senderId,
        productId,
        productComment,
        productRate
      } = req.body
  
      if(!Array.isArray(productId)) {
        productId      = [productId]
        productComment = [productComment]
        productRate    = [productRate]
      }
  
      await comment.insertMany(productId.map((id, index) => (
        {
          orderId: orderId,
          productId: id,
          senderId: senderId,
          comment: productComment[index],
          rate: productRate[index]
        }
      )))
  
      await order.updateOne({ _id: orderId }, {
        isRated: true
      })
  
      const bulkOps = productId.map((id, index) => ({
        updateOne: {
          filter: { _id: id },
          update: [{
            $set: {
              rate: { 
                $divide: [
                  { $add: [{ $multiply: ["$rate", "$rateNumber"] }, parseInt(productRate[index])] },
                  { $add: ["$rateNumber", 1] }
                ]
              },
              rateNumber: { $add: ["$rateNumber", 1] }
            }
          }]
        }
      }))
      await product.bulkWrite(bulkOps)
  
      return res.json({message: true})
      
    } catch (error) {
      return res.json({error: error})
    }
  }
  
  async orderUpdated(req, res, next) {
    try {
      const { id } = req.body
      await order.updateOne({ _id: id }, { status: 'done' })
      return res.json({message: 'Confirm order successfully'})
    
    } catch (error) {
      return res.json({error: error})
    }
  }
  
  async doneOrder(req, res, next) {
    try {
      const { id, email } = req.query
      const orderInfo = await order.findOne({ _id: id }).lean()
      const orderStatus = orderInfo.status
      if (orderStatus !== 'delivered') throw new Error('Order status invalid')
      await order.updateOne({ _id: id }, {
        status: 'done'
      })

      const userInfo = await user.findOne({ email: email }).lean()
      const userId = userInfo._id

      const silver  = 1000000
      const gold    = 2000000
      const diamond = 4000000

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

      return res.json({message: 'Update information successfully'})
    } catch (error) {
      return res.json({error: error.message})
    }
  }
}
module.exports = new allOrderController