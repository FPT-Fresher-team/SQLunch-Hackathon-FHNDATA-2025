const emp = require('../../models/employeeModel')
const store = require('../../models/storeModel')
const position = require('../../models/positionModel')
const checkForHexRegExp = require('../../middleware/checkForHexRegExp')

class profileController {
  async getProfile(req, res, next) {
    try {
      const [userInfo, positionsInfo] = await Promise.all([
        emp.findOne({ _id: req.cookies.uid }).lean(),
        position.find().lean()
      ])
      if (!userInfo) throw new Error('User not found')
  
      return res.json({userInfo: userInfo, positionsInfo: positionsInfo})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async updateProfile(req, res, next) {
    try {
      if (!checkForHexRegExp(req.cookies.uid)) return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
      return res.render('admin/profile', { title: 'Profile', layout: 'admin' } )
    } catch (error) {
      return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
    }
  }

  async profileUpdated(req, res, next) {
    try {
      await emp.updateOne({ _id: req.cookies.uid}, {
        name   : req.body.name   ,
        phone  : req.body.phone  ,
        address: req.body.address,
        gender : req.body.gender ,
      })
  
      return res.json({message: 'Profile updated successfully'})
    } catch (error) {
      return res.json({error: error.message})
    }
  }
}
module.exports = new profileController