const user = require('../models/userModel')
const emp = require('../models/employeeModel')
const jwt = require('jsonwebtoken')
const dbConnect = require('../middleware/mongoose')

async function checkUser(req, res, next) {
  try {
    await dbConnect()
    const rt = req.cookies.rt
    const uid = req.cookies.uid
    
    if (rt && uid) {
      const decoded = jwt.verify(rt, 'SECRET_KEY')
      if (!decoded) throw new Error('error')

      const empInfo = await emp.findOne({ _id: uid })
      if (empInfo) return res.redirect('/admin/all')
      
      const userInfo = await user.findOne({ _id: uid })
      if (!userInfo) throw new Error('error')
      if (userInfo.role !== 'user') throw new Error('error')
      req.isUser = true
    }
    next()
  } catch (error) {
    console.log(error)
    return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
  }
}

module.exports = checkUser