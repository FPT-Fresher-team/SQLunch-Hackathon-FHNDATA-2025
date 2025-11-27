const voucher = require('../../models/voucherModel')
const order = require('../../models/orderModel')
const member = require('../../models/memberModel')
const { ObjectId } = require('mongodb')

class allVouchersController {
  async getVouchers(req, res, next) {
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
        voucher
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(itemsPerPage)
          .lean(),
        voucher.find(filter).countDocuments(),
      ]) 
      if (!data) throw new Error('Data not found')
      
      return res.json({data: data, data_size: dataSize})
    } catch (error) {
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

  async allVouchers(req, res, next) {
    try {
      return res.render('admin/all/voucher', { title: 'Voucher List', layout: 'admin' })
    } catch (error) {
      return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
    }
  }

  async getVoucher(req, res, next) {
    try {
      const voucherInfo = await voucher.findOne({ _id: req.body.id }).lean()
      if (!voucherInfo) throw new Error('Voucher not found')

      const memberInfo = await member.findOne({ code: voucherInfo.memberCode }).lean()
      if (!memberInfo) throw new Error('Member not found')

      const orderInfo = await order.aggregate([
        {
          $match: { 'voucherCode': voucherInfo.code }
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
      
      return res.json({voucherInfo: voucherInfo, memberInfo: memberInfo, orderInfo: orderInfo})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async voucherUpdate(req, res, next) {
    try {
      await voucher.updateOne({ _id: req.body.id }, {
        name        : req.body.name,
        description : req.body.description,
        discount    : req.body.discount,
        maxDiscount : req.body.maxDiscount,
        minOrder    : req.body.minOrder,
        status      : req.body.status,
        startDate   : new Date(req.body.startDate),
        endDate     : new Date(req.body.endDate)
      })
  
      return res.json({message: 'Update voucher successfully'})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async getMembers(req, res, next) {
    try {
      const memberShip = await member.find().lean()
      if (!memberShip) throw new Error('error')
      return res.json({data: memberShip})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async voucherCreated(req, res, next) {
    try {
      const newVoucher = new voucher({
        name        : req.body.name,
        description : req.body.description,
        memberCode  : req.body.memberCode,
        discount    : req.body.discount,
        maxDiscount : req.body.maxDiscount,
        minOrder    : req.body.minOrder,
        memberCode  : req.body.memberCode,
        startDate   : new Date(req.body.startDate),
        endDate     : new Date(req.body.endDate),
      })
      await newVoucher.save()

      return res.json({message: 'Create voucher successfully'})
    } catch (error) {
      return res.json({error: error.message})
    }
  }
}
module.exports = new allVouchersController