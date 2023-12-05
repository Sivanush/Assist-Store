const express = require('express')
const adminRoute = express.Router()
const multer = require('../helpers/multer')

const auth = require('../middleware/adminAuth')

const adminController = require('../controllers/adminController')
const categoryController = require('../controllers/categoryController')
const productController = require('../controllers/productController')

//admin@gmail.com
//admin494


adminRoute.get('/',auth.isLogin,adminController.loadDashboad)

adminRoute.get('/users',auth.isLogin,adminController.loadUsers)

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
adminRoute.post('/product/add',multer.multiupload,productController.addProduct)

adminRoute.get('/product/block/:id',auth.isLogin,productController.blockProduct)
adminRoute.get('/product/unblock/:id',auth.isLogin,productController.unblockProduct)


adminRoute.post('/product/edit/:id',multer.multiupload,productController.editProduct)





















adminRoute.get('/logout',auth.isLogout,adminController.adminLogout)

module.exports = adminRoute 