const express = require('express')
const adminRoute = express.Router()
const multer = require('../helpers/multer')

const auth = require('../middleware/adminAuth')

const adminController = require('../controllers/adminController')
const categoryController = require('../controllers/categoryController')
const productController = require('../controllers/productController')
const orderController = require('../controllers/orderController')
const couponController = require('../controllers/couponController')

//admin@gmail.com
//admin494


adminRoute.get('/',auth.isLogin,adminController.loadDashboad)
adminRoute.get('/generatePdf',adminController.generatePdf)
adminRoute.get('/generateExcel',adminController.generateExcel)

adminRoute.get('/users',auth.isLogin,adminController.loadUsers)
adminRoute.get('/users/:search',auth.isLogin,adminController.loadUsers)

adminRoute.get('/block',auth.isLogin,adminController.blockUser)
adminRoute.get('/unblock',auth.isLogin,adminController.unblockUser)

adminRoute.get('/login',auth.isLogout,adminController.loadLogin)
adminRoute.post('/login',adminController.insertLogin)




adminRoute.get('/category',auth.isLogin,categoryController.loadCategory)
adminRoute.post('/category/add',multer.upload.single('image'),categoryController.insertCategory)

adminRoute.get('/category/list',auth.isLogin,categoryController.listCategory)
adminRoute.get('/category/unlist',auth.isLogin,categoryController.unListCategory)
adminRoute.post('/category/edit/:id',multer.upload.single('image'),categoryController.editCategory)




 


adminRoute.get('/product',auth.isLogin,productController.loadProduct)
adminRoute.get('/product/:search',auth.isLogin,productController.loadProduct)
adminRoute.post('/product/add',multer.multiupload,productController.addProduct)

adminRoute.get('/product/block/:id',auth.isLogin,productController.blockProduct)
adminRoute.get('/product/unblock/:id',auth.isLogin,productController.unblockProduct)


adminRoute.post('/product/edit/:id',multer.multiupload,productController.editProduct)



adminRoute.get('/order',auth.isLogin,orderController.loadOrder)
adminRoute.get('/orderDetail/:orderId',auth.isLogin,orderController.loadOrderDetail)
adminRoute.post('/orderDetail/:orderId',orderController.statusChange)


adminRoute.get('/coupon',auth.isLogin,couponController.loadCoupon)
adminRoute.post('/coupon/add',couponController.addCoupon)
adminRoute.post('/coupon/edit/:id',couponController.editCoupons)
adminRoute.get('/coupon/publish/:id',auth.isLogin,couponController.publish)
adminRoute.get('/coupon/upPublish/:id',auth.isLogin,couponController.unPublish)














adminRoute.get('/logout',auth.isLogout,adminController.adminLogout)

module.exports = adminRoute 