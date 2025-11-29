require('dotenv').config()
const emp = require('../../models/employeeModel')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require("nodemailer")

const verificationCode = {}

class loginController {
  async signIn(req, res, next) {
    return res.render('admin/signIn', { title: 'Employee Login', layout: 'empty'})
  }

  async checkingAccount(req, res, next) {
    try {
      const email = req.body.email
      const password = req.body.password
  
      const getEmp = await emp.findOne({ email: email })
      if (!getEmp) return res.json({isValid: false, message: 'Email not registered'})
  
      bcrypt.compare(password, getEmp.password, async function(err, result) {
        if (result) {
          const salt = await bcrypt.genSalt(10)
          const payload = { email: getEmp.email }; // Payload with only essential data
          const rt = jwt.sign(payload, 'SECRET_KEY', { expiresIn: '1d' })
          const at = jwt.sign(payload, 'SECRET_KEY', { expiresIn: '7d' })
          const userId = getEmp._id.toString()

          await emp.updateOne({ _id: userId}, {
            isActive: true
          })
  
          res.cookie('rt', rt, {
            httpOnly: true,
            secure: true,
          })
          res.cookie('at', at, {
            httpOnly: true,
            secure: true,
          })
          res.cookie('uid', userId, {
            httpOnly: true,
            secure: true,
          })
  
          return res.json({isValid: true, message: 'Login successfully!', role: getEmp.role})
        } else {
          return res.json({isValid: false, message: 'Incorrect password'})
        }
      })
    } catch (error) {
      return res.json({error: error})
    }
  }

  async resetPassword(req, res, next) {
    return res.render('admin/resetPassword', { title: 'Forgot Password', layout: 'empty' })
  }

  async verifyingEmail(req, res, next) {
    try {
      const userEmail     = req.body.email  
      const adminEmail    = process.env.ADMIN_EMAIL
      const adminPassword = process.env.GOOGLE_APP_EMAIL
  
      const emailExist = await emp.findOne({ email: userEmail})
      if (!emailExist) {
        return res.json({message: false})
      }
  
      const transporter = nodemailer.createTransport({
        service: "gmail",
        secure: false, // true for port 465, false for other ports
        auth: {
          user: adminEmail,
          pass: adminPassword,
        },
      })
  
      function generateResetCode() {
        return Math.floor(100000 + Math.random() * 900000).toString() // 6-digit code
      }
      
      async function sendEmail(userEmail) {
        const resetCode = generateResetCode()
        verificationCode[userEmail] = resetCode
        console.log(verificationCode)
  
        await transporter.sendMail({
          from: adminEmail, 
          to: userEmail, 
          subject: "Password Reset Code", 
          text: "Your password reset code is: " + resetCode, 
        })
      }
  
      await sendEmail(userEmail)
      return res.json({message: true})
      
    } catch (error) {
      return res.json({error: error})
    }
  }

  async verifyingCode(req, res, next) {
    try {
      const email = req.body.email
      const code  = req.body.code
      console.log(email, code)
      if (verificationCode[email] && verificationCode[email] === code) {
        delete verificationCode[email] // Remove code after verification
        return res.json({message: true})
      }
      return res.json({message: false})
      
    } catch (error) {
      return res.json({error: error})
    }
  }

  async resettingPassword(req, res, next) {
    try {
      const email = req.body.email
      const password = req.body.password
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)
  
      await emp.updateOne({ email: email}, {
        password: hashedPassword
      })
  
      return res.json({message: true})
      
    } catch (error) {
      return res.json({error: error})
    }
  }
}
module.exports = new loginController