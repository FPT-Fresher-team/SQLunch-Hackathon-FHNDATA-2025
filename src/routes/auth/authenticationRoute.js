const express = require('express')
const router = express.Router()
const flash = require('connect-flash');
const session = require('express-session')
const authenticationController = require('../../app/controllers/auth/authenticationController')

router.use(session({ 
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}));
router.use(flash())
router.get('/sign-in'                   , authenticationController.signIn )
router.post('/checking-account'         , authenticationController.checkingAccount )
router.post('/checking-google-account'  , authenticationController.checkingGoogleAccount )

router.get('/sign-up'                         , authenticationController.signUp )
router.post('/sign-up/verifying-email'        , authenticationController.verifyCreatingEmail )
router.post('/sign-up/verifying-code'         , authenticationController.verifyCreatingCode )
router.post('/creating-account'               , authenticationController.creatingAccount )

router.get('/reset-password'                  , authenticationController.resetPassword )
router.post('/reset-password/verifying-email' , authenticationController.verifyCheckingEmail )
router.post('/reset-password/verifying-code'  , authenticationController.verifyCheckingCode )
router.post('/resetting-password'             , authenticationController.resettingPassword )

module.exports = router