const express = require('express')
const userRoute = express.Router()
 

const auth = require('../middleware/userAuth')
const userController = require('../controllers/userController')
const cartController = require('../controllers/cartController')
const { use } = require('bcrypt/promises')




userRoute.get('/',userController.homePage)

userRoute.get('/login',auth.isLogout,userController.loadLogin)
userRoute.post('/login',userController.VerifyLogin)

userRoute.get('/signup',auth.isLogout,userController.loadSignup)
userRoute.post('/signup',userController.insertUser)

userRoute.get('/otp',auth.isLogout,userController.loadOtp)
userRoute.post('/otp',userController.verifyOtp)


userRoute.get('/shop',auth.isLogin,userController.loadShop)

userRoute.get('/product-detail/:id',auth.isLogin,userController.loadDetailView)

userRoute.get('/logout',userController.logout)




userRoute.get('/cart',auth.isLogin,cartController.loadCart)

userRoute.post('/addToCart/:productId',cartController.addToCart)
userRoute.post('/removeCart/:productId',cartController.removeProduct)
userRoute.post('/changeQuantity/:productId',cartController.productQuantity)


userRoute.get('/forgetPassword',userController.LoadForgetPassword)
userRoute.post('/forgetPassword',userController.forgetPassword)

userRoute.get('/password/:token',userController.loadPasswordInput)
userRoute.post('/password/:token',userController.passwordInput)

userRoute.post('/resend',userController.resendOtp)


userRoute.get('/profile',userController.loadProfile)

module.exports =  userRoute