// middleware
const checkAdmin    = require('../app/middleware/checkAdmin')
const checkUser     = require('../app/middleware/checkUser')
const cookieParser  = require('cookie-parser')

// admin
const adminHomeRoute        = require('./admin/homeRoute')
const adminBrandRoute       = require('./admin/brandRoute')
const adminBlogRoute        = require('./admin/blogRoute')
const adminCustomerRoute    = require('./admin/customerRoute')
const adminVoucherRoute     = require('./admin/voucherRoute')
const adminUVoucherRoute    = require('./admin/uVoucherRoute')
const adminChatRoute        = require('./admin/chatRoute')
const adminEmployeeRoute    = require('./admin/employeeRoute')
const adminOrderRoute       = require('./admin/orderRoute')
const adminProductRoute     = require('./admin/productRoute')
const adminPurchaseRoute    = require('./admin/purchaseRoute')
const adminStoreRoute       = require('./admin/storeRoute')
const adminSupplierRoute    = require('./admin/supplierRoute')
const adminAttributesRoute  = require('./admin/attributeRoute')
const adminProfileRoute     = require('./admin/profileRoute')
const adminLogOutRoute      = require('./admin/logOutRoute')
const adminRefreshRoute     = require('./admin/refreshToken')
const analyticsRoute        = require('./admin/analyticsRoute')

// user
const homeRoute           = require('./user/homeRoute')
const allProductsRoute    = require('./user/allProductsRoute')
const allBrandsRoute      = require('./user/allBrandsRoute')
const allOrdersRoute      = require('./user/allOrdersRoute')
const allBlogsRoute       = require('./user/allBlogsRoute')
const allVouchersRoute    = require('./user/allVouchersRoute')
const introduceRoute      = require('./user/introduceRoute')
const profileRoute        = require('./user/profileRoute')
const advancedSearchRoute = require('./user/advancedSearchRoute')
const logOutRoute         = require('./user/logOutRoute')
const chatRoute           = require('./user/chatRoute')
const refreshRoute        = require('./user/refreshToken')
const trackRoute          = require('./user/trackRoute')
const cartTrackingRoute   = require('./user/cartTrackingRoute')

// login
const authenticationRoute    = require('./auth/authenticationRoute')
const empAuthenticationRoute = require('./auth/empAuthenticationRoute')
function route(app) {
  app.use(cookieParser())
  // admin
  app.use('/admin/all'               , checkAdmin, adminHomeRoute)
  app.use('/admin/all-brands'        , checkAdmin, adminBrandRoute)
  app.use('/admin/all-blogs'         , checkAdmin, adminBlogRoute)
  app.use('/admin/blog'              , checkAdmin, adminBlogRoute)
  app.use('/admin/all-customers'     , checkAdmin, adminCustomerRoute)
  app.use('/admin/all-vouchers'      , checkAdmin, adminVoucherRoute)
  app.use('/admin/all-u-vouchers'    , checkAdmin, adminUVoucherRoute)
  app.use('/admin/all-chats'         , checkAdmin, adminChatRoute)
  app.use('/admin/all-employees'     , checkAdmin, adminEmployeeRoute)
  app.use('/admin/all-orders'        , checkAdmin, adminOrderRoute)
  app.use('/admin/all-products'      , checkAdmin, adminProductRoute)
  app.use('/admin/all-purchases'     , checkAdmin, adminPurchaseRoute)
  app.use('/admin/all-stores'        , checkAdmin, adminStoreRoute)
  app.use('/admin/all-suppliers'     , checkAdmin, adminSupplierRoute)
  app.use('/admin/all-attributes'    , checkAdmin, adminAttributesRoute)
  app.use('/admin/all-personal-info' , checkAdmin, adminProfileRoute)
  app.use('/admin/analytics'         , checkAdmin, analyticsRoute)
  app.use('/admin/log-out'           , checkAdmin, adminLogOutRoute)
  app.use('/admin/refresh-token'     , checkAdmin, refreshRoute)
  app.use('/admin/*', function(req, res) {
    return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
  })

  // user
  app.use('/'               , checkUser, homeRoute)
  app.use('/home'           , checkUser, homeRoute)
  app.use('/all-products'   , checkUser, allProductsRoute)
  app.use('/all-brands'     , checkUser, allBrandsRoute)
  app.use('/all-orders'     , checkUser, allOrdersRoute)
  app.use('/all-blogs'      , checkUser, allBlogsRoute)
  app.use('/all-vouchers'   , checkUser, allVouchersRoute)
  app.use('/introduce'      , checkUser, introduceRoute)
  app.use('/profile'        , checkUser, profileRoute)
  app.use('/advanced-search', checkUser, advancedSearchRoute)
  app.use('/log-out'        , checkUser, logOutRoute)
  app.use('/api/chat'       , checkUser, chatRoute)
  app.use('/api'            , trackRoute)
  app.use('/api'            , cartTrackingRoute)
  app.use('/api/blogs'      , checkUser, allBlogsRoute)
  app.use('/refresh-token'  , refreshRoute)

  // login
  app.use('/authentication'     , authenticationRoute)
  app.use('/emp/authentication' , empAuthenticationRoute)

  // keep-alive
  app.use('/keep', function handler(req, res) {
    res.status(200).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
  })
  
  // all
  app.use('/*', function(req, res) {
    return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
  })
}
module.exports = route