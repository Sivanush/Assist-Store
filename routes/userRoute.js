const express = require('express')
const userRoute = express.Router()
 
const { use } = require('bcrypt/promises')
const auth = require('../middleware/userAuth')
const userController = require('../controllers/userController')
const cartController = require('../controllers/cartController')
const wishlistController = require('../controllers/wishlistController')
const walletController = require('../controllers/walletController')




userRoute.get('/',userController.homePage)

userRoute.get('/login',auth.isLogout,userController.loadLogin)
userRoute.post('/login',userController.VerifyLogin)

userRoute.get('/signup',auth.isLogout,userController.loadSignup)
userRoute.post('/signup',userController.insertUser)

userRoute.get('/otp',auth.isLogout,userController.loadOtp)
userRoute.post('/otp',userController.verifyOtp)


userRoute.get('/shop',userController.loadShop)

userRoute.get('/product-detail/:id',userController.loadDetailView)

userRoute.get('/logout',userController.logout)




userRoute.get('/cart',auth.isLogin,cartController.loadCart)
userRoute.post('/applyCoupon',cartController.applyCoupon)

userRoute.post('/addToCart/:productId',cartController.addToCart)
userRoute.get('/removeCart/:productId',cartController.removeProduct)
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
userRoute.get('/profileAddress/delete/:addressId',userController.deleteAddress)
userRoute.post('/profileAddressAdd/:userId',userController.addAddress)
userRoute.post('/profileAddressEdit/:addressId',userController.editAddress)
userRoute.get('/profileOrder',auth.isLogin,userController.loadProfileOrder)
userRoute.get('/orderDetail/:orderId',auth.isLogin,cartController.orderDetail)
userRoute.post('/orderCancel/:orderId',userController.cancelOrder)
userRoute.post('/returnOrder/:orderId',userController.returnOrder)
userRoute.get('/orderInvoicePdf/:orderId',userController.orderInvoicePdf)
userRoute.get('/profileWallet',auth.isLogin,walletController.loadWallet)
userRoute.post('/profileWallet',walletController.addMoney)
userRoute.post('/profileWalletWithdraw',walletController.debitMoney)


userRoute.get('/wishlist',auth.isLogin,wishlistController.loadWishlist)
userRoute.post('/addToWishlist/:productId',wishlistController.addWishlist)
userRoute.post('/addToCartWishlist/:productId',wishlistController.addToCartInWishlist)
userRoute.get('/removeWishlist/:productId',wishlistController.removeProduct)

module.exports =  userRoute