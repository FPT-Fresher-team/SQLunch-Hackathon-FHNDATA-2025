const member = require('../../models/memberModel')
const orderStatus = require('../../models/orderStatusModel')
const paymentMethod = require('../../models/paymentMethodModel')
const position = require('../../models/positionModel')
const productStatus = require('../../models/productStatusModel')

class attributeController {
  async show(req, res, next) {
    try {
      return res.render('admin/attribute', { title: 'Attribute Management', layout: 'admin' })
    } catch (error) {
      return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
    } 
  }

  // read
  async getMembership(req, res, next) {
    try {
      const membership = await member.find().lean()
      return res.json({data: membership})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async getOrderStatus(req, res, next) {
    try {
      const orderStatuses = await orderStatus.find().sort({order: 1}).lean()
      return res.json({data: orderStatuses})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async getPaymentMethod(req, res, next) {
    try {
      const paymentMethods = await paymentMethod.find().lean()
      return res.json({data: paymentMethods})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async getPosition(req, res, next) {
    try {
      const positions = await position.find().lean()
      return res.json({data: positions})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async getProductStatus(req, res, next) {
    try {
      const productStatuses = await productStatus.find().lean()
      return res.json({data: productStatuses})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  // create
  async createMembership(req, res, next) {
    try {
      await member.create(req.body)
      return res.json({message: 'Add successful'})
    } catch (error) {
      return res.json({error: error.message})
    } 
  }

  async createOrderStatus(req, res, next) {
    try {
      await orderStatus.create(req.body)
      return res.json({message: 'Add successful'})
    } catch (error) {
      return res.json({error: error.message})
    } 
  }

  async createPaymentMethod(req, res, next) {
    try {
      await paymentMethod.create(req.body)
      return res.json({message: 'Add successful'})
    } catch (error) {
      return res.json({error: error.message})
    } 
  }

  async createPosition(req, res, next) {
    try {
      await position.create(req.body)
      return res.json({message: 'Add successful'})
    } catch (error) {
      return res.json({error: error.message})
    } 
  }

  async createProductStatus(req, res, next) {
    try {
      await productStatus.create(req.body)
      return res.json({message: 'Add successful'})
    } catch (error) {
      return res.json({error: error.message})
    } 
  }

  // update
  async updateMembership(req, res, next) {
    try {
      await member.updateOne({ code: req.body.code}, {
        name: req.body.name
      })
      return res.json({message: 'Update successful'})
    } catch (error) {
      return res.json({error: error.message})
    } 
  }

  async updateOrderStatus(req, res, next) {
    try {
      await orderStatus.updateOne({ code: req.body.code}, {
        name: req.body.name,
        order: req.body.order
      })
      return res.json({message: 'Update successful'})
    } catch (error) {
      return res.json({error: error.message})
    } 
  }

  async updatePaymentMethod(req, res, next) {
    try {
      await paymentMethod.updateOne({ code: req.body.code}, {
        name: req.body.name
      })
      return res.json({message: 'Update successful'})
    } catch (error) {
      return res.json({error: error.message})
    } 
  }

  async updatePosition(req, res, next) {
    try {
      await position.updateOne({ code: req.body.code}, {
        name: req.body.name,
        wage: req.body.wage
      })
      return res.json({message: 'Update successful'})
    } catch (error) {
      return res.json({error: error.message})
    } 
  }

  async updateProductStatus(req, res, next) {
    try {
      await productStatus.updateOne({ code: req.body.code}, {
        name: req.body.name
      })
      return res.json({message: 'Update successful'})
    } catch (error) {
      return res.json({error: error.message})
    } 
  }

  // delete
  async deleteMembership(req, res, next) {
    try {
      await member.deleteOne({ code: req.body.code})
      return res.json({message: 'Deleted successfully'})
    } catch (error) {
      return res.json({error: error.message})
    } 
  }

  async deleteOrderStatus(req, res, next) {
    try {
      await orderStatus.deleteOne({ code: req.body.code})
      return res.json({message: 'Deleted successfully'})
    } catch (error) {
      return res.json({error: error.message})
    } 
  }

  async deletePaymentMethod(req, res, next) {
    try {
      await paymentMethod.deleteOne({ code: req.body.code})
      return res.json({message: 'Deleted successfully'})
    } catch (error) {
      return res.json({error: error.message})
    } 
  }

  async deletePosition(req, res, next) {
    try {
      await position.deleteOne({ code: req.body.code})
      return res.json({message: 'Deleted successfully'})
    } catch (error) {
      return res.json({error: error.message})
    } 
  }

  async deleteProductStatus(req, res, next) {
    try {
      await productStatus.deleteOne({ code: req.body.code})
      return res.json({message: 'Deleted successfully'})
    } catch (error) {
      return res.json({error: error.message})
    } 
  }
}
module.exports = new attributeController