const user = require('../models/userModel')
const emp = require('../models/employeeModel')
const position = require('../models/positionModel')
const jwt = require('jsonwebtoken')
const dbConnect = require('../middleware/mongoose')

async function checkAdmin(req, res, next) {
  try {
    await dbConnect()
    const rt = req.cookies.rt
    const uid = req.cookies.uid

    if (rt && uid) {
      const decodedRefreshToken = jwt.verify(rt, 'SECRET_KEY')
      if (!decodedRefreshToken) throw new Error('error decoded refresh token')

      const userInfo = await user.findOne({ _id: uid })
      if (userInfo) return res.redirect('/')
      
      const empInfo = await emp.findOne({ _id: uid })
      const positions = await position.find().lean()
      const positionCodes = positions.map(positions => positions.code)

      if (!empInfo) throw new Error('error')
      if (!positionCodes.includes(empInfo.role)) throw new Error('error')
      next()
    } else {
      throw new Error('error')
    }
  } catch (error) {
    return res.status(403).render('partials/denyAdminAccess', { title: 'Not found', layout: 'empty' })
  }
}

module.exports = checkAdmin