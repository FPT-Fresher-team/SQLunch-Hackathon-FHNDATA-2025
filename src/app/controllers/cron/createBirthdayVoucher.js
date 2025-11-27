require('dotenv').config()
const user = require('../../models/userModel')
const userVoucher = require('../../models/userVoucherModel')
const nodemailer = require("nodemailer")

async function createBirthdayVoucher(user) {
  const now = new Date()
  console.log("Running birthday voucher cron...")
  const code = `BDAY_${user._id}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  const voucher = new userVoucher({
    userId: user._id,
    code: code,
    description: `Happy Birthday ${user.name}! Enjoy your special discount.`,
    discount: 100000,
    minOrder: 500000,
    startDate: now,
    endDate: new Date(new Date().setMonth(now.getMonth() + 1)),
  })
  await voucher.save()

  const userEmail     = user.email
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
      subject: "Tặng bạn voucher giảm giá trong tháng sinh nhật", 
      text: 'Mã voucher của bạn là: ' + code, 
    })
  }

  await sendEmail(userEmail)

  return
}

async function getUsersWithBirthdayThisMonth() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const userHasVoucher = await userVoucher.find({ startDate: { $gte: start, $lt: end } }).distinct('userId').lean()

  const users = await user.find({
    dob: {
      $ne: null,
      // $gte: start,
      // $lt: end
    },
    userId: { $nin: userHasVoucher }
  }).lean()
  await Promise.all(users.map(createBirthdayVoucher))
}

module.exports = { getUsersWithBirthdayThisMonth }