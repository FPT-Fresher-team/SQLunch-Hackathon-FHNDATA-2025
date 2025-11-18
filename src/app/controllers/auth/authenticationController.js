require('dotenv').config()
const user = require('../../models/userModel')
const chat = require('../../models/chatModel')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require("nodemailer")

const verifyCheckingAccountCode = {}
const verifyCreatingAccountCode = {}

class authenticationController {  
  async signIn(req, res, next) {
    return res.render('users/signIn', { title: 'Đăng Nhập', layout: 'empty' })
  }

  async checkingAccount(req, res, next) {
    try {
      const email = req.body.email
      const password = req.body.password

      const getUser = await user.findOne({ email: email })
      if (!getUser) return res.json({isValid: false, message: 'Email chưa đăng ký tài khoản'})

      bcrypt.compare(password, getUser.password, async function(err, result) {
        if (result) {
          const payload = { email: getUser.email }// Payload with only essential data
          const rt = jwt.sign(payload, 'SECRET_KEY', { expiresIn: '1d' })
          const at = jwt.sign(payload, 'SECRET_KEY', { expiresIn: '7d' })
          const userId = getUser._id.toString()
          await user.updateOne({ _id: userId}, {
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

          if (getUser.role === 'user') return res.json({isValid: true, message: 'Đăng nhập thành công'})

        } else {
          return res.json({isValid: false, message: 'Mật khẩu không đúng'})
        }
      })
    } catch (error) {
      return res.json({error: error})
    }
  }

  async signUp(req, res, next) {
    return res.render('users/signUp', { title: 'Đăng Ký', layout: 'empty' })
  }

  async verifyCreatingEmail(req, res, next) {
    try {
      const userEmail     = req.body.email  
      const adminEmail    = process.env.ADMIN_EMAIL
      const adminPassword = process.env.GOOGLE_APP_EMAIL

      const emailExist = await user.findOne({ email: userEmail})
      if (emailExist) return res.json({isValid: false, message: 'Email đã tồn tại'})

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
      
      // async..await is not allowed in global scope, must use a wrapper
      async function sendEmail(userEmail) {
        const resetCode = generateResetCode()
        verifyCreatingAccountCode[userEmail] = resetCode

        await transporter.sendMail({
          from: adminEmail, 
          to: userEmail, 
          subject: "Mã xác minh Email", 
          text: 'Mã xác minh Email của bạn là: ' + resetCode, 
        })
      }

      await sendEmail(userEmail)
      return res.json({isValid: true, message: 'Kiểm tra email thành công'})

    } catch (error) {
      return res.json({error: error})
    }
  }
  
  async verifyCreatingGoogleEmail(req, res, next) {
    try {
      const userEmail  = req.body.email  
      const emailExist = await user.findOne({ email: userEmail})
      if (emailExist) return res.json({isValid: false, message: 'Email đã đăng ký tài khoản'})

      return res.json({isValid: true, message: 'Kiểm tra email thành công'})

    } catch (error) {
      return res.json({error: error})
    }
  }

  async verifyCreatingCode(req, res, next) {
    try {
      const email = req.body.email
      const code  = req.body.code
      if (verifyCreatingAccountCode[email] && verifyCreatingAccountCode[email] === code) {
        delete verifyCreatingAccountCode[email] // Remove code after verification
        return res.json({message: true})
      }
      return res.json({message: false})
      
    } catch (error) {
      return res.json({error: error})
    }
  }

  async creatingAccount(req, res, next) {
    try {
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(req.body.password, salt)
  
      let newUser = new user({
        email: req.body.email,
        password: hashedPassword,
        role: 'user',
        name: req.body.name,
      })
      const savedUser = await newUser.save()
  
      const adminId = process.env.ADMIN_ID
      const newChat = new chat({
        adminId: adminId,
        userId: savedUser._id,
        lastMessage: ''
      })
      const newAIChat = new aiChat({
        userId: savedUser._id,
        lastMessage: ''
      })
      await newChat.save()
      await newAIChat.save()
  
      return res.json({isSuccessful: true, message: 'Đăng ký tài khoản thành công'})
      
    } catch (error) {
      return res.json({error: error})
    }
  }

  async resetPassword(req, res, next) {
    return res.render('users/resetPassword', { title: 'Quên mật khẩu', layout: 'empty' })
  }

  async verifyCheckingEmail(req, res, next) {
    try {
      const userEmail     = req.body.email  
      const adminEmail    = process.env.ADMIN_EMAIL
      const adminPassword = process.env.GOOGLE_APP_EMAIL
  
      const emailExist = await user.findOne({ email: userEmail})
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
      
      // async..await is not allowed in global scope, must use a wrapper
      async function sendEmail(userEmail) {
        const resetCode = generateResetCode()
        verifyCheckingAccountCode[userEmail] = resetCode
  
        await transporter.sendMail({
          from: adminEmail, 
          to: userEmail, 
          subject: "Mã xác nhận mật khẩu", 
          text: 'Mã xác nhận lấy lại mật khẩu của bạn là: ' + resetCode,
        })
      }
  
      await sendEmail(userEmail)
      res.json({message: true})
      
    } catch (error) {
      return res.json({error: error})
    }
  }

  async verifyCheckingCode(req, res, next) {
    try {
      const email = req.body.email
      const code  = req.body.code
      if (verifyCheckingAccountCode[email] && verifyCheckingAccountCode[email] === code) {
        delete verifyCheckingAccountCode[email] // Remove code after verification
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
  
      await user.updateOne({ email: email}, {
        password: hashedPassword
      })
  
      return res.json({message: true})
      
    } catch (error) {
      return res.json({error: error})
    }
  }

  async checkingGoogleAccount(req, res, next) {
    const email = req.body.email
    try {
      const getUser = await user.findOne({ email: email })
      console.log(getUser)
      if (!getUser) return res.json({isValid: false, message: 'Email chưa đăng ký tài khoản'})

      const payload = { email: getUser.email }// Payload with only essential data
      const rt = jwt.sign(payload, 'SECRET_KEY', { expiresIn: '1d' })
      const at = jwt.sign(payload, 'SECRET_KEY', { expiresIn: '7d' })
      const userId = getUser._id.toString()
      await user.updateOne({ _id: userId}, {
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

      return res.json({isValid: true, message: 'Đăng nhập thành công'})
    } catch (error) {
      return res.json({error: error})
    }
  }

  async creatingGoogleAccount(req, res, next) {
    try {
      const userEmail = req.body.email  
      const emailExist = await user.findOne({ email: userEmail})
      if (emailExist) return res.json({isValid: false, message: 'Email đã tồn tại'})

      let newUser = new user({
        email: req.body.email,
        // password: hashedPassword,
        role: 'user',
        name: req.body.name,
      })
      const savedUser = await newUser.save()
  
      const adminId = process.env.ADMIN_ID
      const newChat = new chat({
        adminId: adminId,
        userId: savedUser._id,
        lastMessage: ''
      })
      await newChat.save()
  
      return res.json({isValid: true, message: 'Đăng ký tài khoản thành công'})
      
    } catch (error) {
      return res.json({error: error})
    }
  }
}
module.exports = new authenticationController