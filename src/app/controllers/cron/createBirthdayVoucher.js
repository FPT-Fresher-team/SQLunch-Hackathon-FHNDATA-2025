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

  // Beautiful HTML Email Template
  const htmlEmail = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #f9f9f9;">
      <div style="text-align: center; padding: 20px;">
        <h1 style="color: #d4386c; margin: 0;">🎉 Happy Birthday, ${user.firstName || user.name}! 🎉</h1>
      </div>

      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          We hope you're having an amazing day filled with joy and celebration! 
          As our way of saying <strong>thank you</strong> for being part of our family, here's a special gift just for you:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <div style="background: linear-gradient(135deg, #ff6b6b, #feca57); color: white; padding: 20px; border-radius: 12px; display: inline-block; font-size: 24px; font-weight: bold; letter-spacing: 3px;">
            ${code}
          </div>
        </div>

        <ul style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; color: #333;">
          <li><strong>Discount:</strong> 100,000 VND off your order</li>
          <li><strong>Minimum order:</strong> 500,000 VND</li>
          <li><strong>Valid until:</strong> ${voucher.endDate.toLocaleDateString('en-GB')}</li>
          <li>One-time use only</li>
        </ul>

        <p style="text-align: center; margin-top: 30px;">
          <a href="https://beaute-cosmetic.vercel.app/" 
             style="background-color: #d4386c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">
            Shop Now & Use Your Voucher 🎁
          </a>
        </p>

        <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
          Thank you for being an amazing customer.<br>
          Wishing you a year filled with happiness and success!<br><br>
          Warm regards,<br>
          <strong>The [Your Store Name] Team</strong>
        </p>
      </div>
    </div>
  `;

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
      subject: `🎂 Happy Birthday ${user.firstName || user.name}! Here's Your Exclusive Gift`, 
      text: `Happy Birthday ${user.firstName || user.name}! Use code ${code} to get 100,000 VND off your next order (min. 500,000 VND). Valid until ${voucher.endDate.toLocaleDateString()}.`,
      html: htmlEmail
    })
  }

  await sendEmail(userEmail)

  return
}

async function getUsersWithBirthdayThisMonth() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // JS: 0-11 → Mongo: 1-12

  // Users who already got a voucher this month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const userHasVoucher = await userVoucher
    .find({ startDate: { $gte: startOfMonth, $lte: endOfMonth } })
    .distinct('userId')
    .lean();

  // Match users by month (and day) of birth
  const users = await user.find({
    dob: { $ne: null },
    $expr: {
      $eq: [{ $month: "$dob" }, currentMonth]
    },
    userId: { $nin: userHasVoucher }
  }).lean();

  await Promise.all(users.map(createBirthdayVoucher));

  console.log(`Birthday vouchers sent to ${users.length} users`);
}

module.exports = { getUsersWithBirthdayThisMonth }