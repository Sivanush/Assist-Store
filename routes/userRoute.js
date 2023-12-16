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
userRoute.get('/checkout',auth.isLogin,cartController.loadCheckout)
userRoute.post('/checkout',cartController.orderConfirm)

userRoute.get('/forgetPassword',userController.LoadForgetPassword)
userRoute.post('/forgetPassword',userController.forgetPassword)

userRoute.get('/password/:token',userController.loadPasswordInput)
userRoute.post('/password/:token',userController.passwordInput)

userRoute.post('/resend',userController.resendOtp)


userRoute.get('/profile',auth.isLogin,userController.loadProfile)
userRoute.get('/profileEdit',auth.isLogin,userController.loadProfileEdit)
userRoute.post('/profileEdit/:userId',userController.submitProfileEdit)
userRoute.get('/profileAddress',auth.isLogin,userController.loadProfileAddress)
userRoute.post('/profileAddressAdd/:userId',userController.addAddress)
userRoute.post('/profileAddressEdit/:addressId',userController.editAddress)
userRoute.get('/profileOrder',auth.isLogin,userController.loadProfileOrder)
userRoute.get('/orderDetail/:orderId',auth.isLogin,cartController.orderDetail)
userRoute.post('/orderDetail/:orderId',userController.cancelOrder)

module.exports =  userRoute