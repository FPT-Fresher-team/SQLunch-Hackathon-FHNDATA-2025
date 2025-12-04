require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')

/*add more for caching */
const oneYearInSeconds = 31536000;
const oneYearInMilliseconds = oneYearInSeconds * 1000;
/* done adding*/ 

const handlebars = require('express-handlebars')
const path = require('path')
const methodOverride = require('method-override')
const app = express()
const route = require('./routes')
const db = require('./config/db')
const { createServer } = require("http")
const server = createServer(app)
const port = process.env.PORT
const cron = require('node-cron')
const { getUsersWithBirthdayThisMonth } = require('./app/controllers/cron/createBirthdayVoucher') 
const { setVoucherExpired } = require('./app/controllers/cron/setVoucherExpired') 
const { setFlashDealProducts, randomizeSaleNumber } = require('./app/controllers/cron/setFlashDealProducts')
const { setTopSellingProducts } = require('./app/controllers/cron/setTopSellingProducts')
const { setNewArrivalProducts } = require('./app/controllers/cron/setNewArrivalProducts')
const { resetStatusProducts } = require('./app/controllers/cron/resetStatusProducts')

// ⭐ ADD THIS
// const { initProducer } = require('./app/kafka/producer.js');

// db.connect();

// // ⭐ ADD THIS — connects once on server startup
// initProducer();
// console.log("Starting kafka producer...");

// setTimeout(() => {
//     console.log("This prints after 5 seconds");
//     // Put the code you want to run later HERE
// }, 5000);


// const { startAllConsumers } = require('./app/kafka/RunAllConsumers');

// startAllConsumers();


db.connect()
app.use(express.json({ limit: '50mb' }))
/* app.use(express.static(path.join(__dirname, 'public'))) */
// Change to
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: oneYearInMilliseconds, // Thiết lập Cache-Control Header TTL (1 năm)
    immutable: true // Tùy chọn: khuyến nghị dùng nếu tên file tĩnh của bạn có hash
}));

app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(morgan('combined'))
app.use(cookieParser())
app.use(methodOverride('_method'))
app.engine('hbs', handlebars.engine({
  extname: '.hbs',
  defaultLayout: 'users',
  helpers: {
    addIndex: (a, b) => a + b,
    holderData: (a) => Array(a).fill({})
  } 
}))
app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'resource', 'views'))
app.set('view options', { layout: 'other' })

// cron.schedule("0 0 * * *", async () => {
//   console.log("Running birthday voucher cron...")
//   try {
//     await getUsersWithBirthdayThisMonth()

//     console.log("Birthday vouchers created successfully.")
//   } catch (err) {
//     console.error("Error creating birthday vouchers:", err)
//   }
// })

async function main() {
  // await getUsersWithBirthdayThisMonth()
  // await setVoucherExpired()
  // await resetStatusProducts()
  // await setFlashDealProducts()
  // await setTopSellingProducts()
  // await setNewArrivalProducts()
  // await randomizeSaleNumber()
}

main()

route(app)
server.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
})