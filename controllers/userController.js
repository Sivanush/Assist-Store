const mongoose = require('mongoose')
const User = require('../models/userModel')
const otp = require('../helpers/otp')
const forgetOtp = require('../helpers/forgetOtp')
const pass = require('../helpers/spassword')
const crypto = require('crypto')
const flash = require('connect-flash');
require('dotenv').config();


const Product = require('../models/productModel')
const Category = require('../models/categoryModal')
const Cart = require('../models/cartModel')
const Address = require('../models/addressModel')
const Order = require('../models/orderModel')

// To load the home page

const homePage = async (req, res) => {
    try {
        // const category = await Category.findOne({category:})
        const productData = await Product.find({isPublish:true,isComing:false}).sort({ createdAt: -1 }).limit(6)

        const categoryData = await Category.find({isListed:true})

        const comingData = await Product.find({isComing:true}).sort({ createdAt: -1 })

        const userData = req.session.user
        if (req.session.user==null) {
            res.render('index',{
                user:null,
                product:productData,
                category:categoryData,
                comingData:comingData   
            })
        } else {
            res.render('index',{
                user:userData,
                product:productData,
                category:categoryData,
                comingData:comingData  
            }) 
        }
             
    } catch (error) {
        console.log(error.message);
    } 
}



//for user to logout from the site

const logout = async(req,res)=>{
    try {
        
        req.session.user = null
        res.redirect('/login')

    } catch (error) {
        console.log(error.message);
    }
}


//for the user to signUp to the website

const loadSignup = async (req, res) => {
    try {
        res.render('user/signup')
    } catch (error) {
        console.log(error.message);
    }
}



//to insert a user to otp page to verify it


const insertUser = async (req, res) => {
    try {
        const existingEmail = await User.findOne({
            email: req.body.email
        })
        const existingMobile = await User.findOne({
            mobile: req.body.mobile
        })

        if (existingEmail && existingMobile) {
            res.render('user/signup', {
                message: 'Email and PhoneNo already exist!'
            })
        } else if (existingEmail) {
            res.render('user/signup', {
                message: 'Email already exist!'
            })
        } else if (existingMobile) {
            res.render('user/signup', {
                message: 'Phone No already exist!'
            })
        } else {

            
            const otpCode = otp.generate()

            //for saving otp datas in session for verifing in future

            req.session.tempUser = req.body;
            req.session.email = req.body.email
            req.session.otp = otpCode
            req.session.otpExpire = Date.now() + 60*1000

            console.log('OTP:'+req.session.otp);

            await otp.sendOtp(req.session.email, otpCode)

                .then((result) => {

                    res.redirect('/otp');
                    console.log(result);

                }).catch((err) => {

                    res.render('user/signup', {message: 'error in otp'})
                    console.log(err);

                });

        }
    } catch (error) {
        console.log(error.message);
    }
}




//load the OTP page to verify the user coming form signup


const loadOtp = async (req, res) => {
    try {
        res.render('user/otp')
    } catch (error) {
        console.log(error.message);
    }
}




//to verify the user otp by crosschecking


const verifyOtp = async(req,res)=>{
    try {
        const {one,two,three,four} = req.body
        const enteredOtp = `${one}${two}${three}${four}`
        const otp = req.session.otp
        const expireOtp = req.session.otpExpire

        console.log('Entered otp:',enteredOtp);
        console.log('session otp:',otp);

        if (otp===enteredOtp&&Date.now()<expireOtp) {

            req.session.otp = null
            const userData = req.session.tempUser
            const spassword = await pass.securePassword(userData.password)
            const user = await User.create({

                firstName:userData.firstName,
                lastName:userData.lastName,
                email:userData.email,
                mobile:userData.mobile,
                password:spassword,
                isBlocked:false,

            })

            const userInfo = await user.save()
            if (userInfo) {
                req.session.user = user
                res.redirect('/login')
            } else {
                res.render('404error')
            }
        } else {
            res.render('user/otp', { message: 'Incorrect OTP or Expired OTP. Please try again.' });
        }
    } catch (error) {
        console.log(error.message);
    }
}









const resendOtp = async(req,res)=>{
    try {
        
        const email = req.session.email
        
        if (req.session.otp || req.session.otpExpire < Date.now()) {
            const otpCode = otp.generate()
            req.session.otp = otpCode
            req.session.otpExpire = Date.now() + 60*1000
            console.log('New Entered Otp'+otpCode);
            await otp.sendOtp(email,otpCode)
            .then((result)=>{
                console.log(result);
                res.redirect('/otp')
            })
            .catch((err)=>{
                console.log(err);
                res.render('user/signup', {message: 'error in otp'})
            })
        }
    } catch (error) {
        console.log(error.message);
    }
}










//load Login page 


const loadLogin = async (req, res) => {
    try {
        res.render('user/login')
    } catch (error) {
        console.log(error.message);
    }
}


// verify the user with give data that the person already exist 

const VerifyLogin = async(req,res)=>{
    try {
        const {email,password} = req.body
        const userData = await User.findOne({email:email})
        if (userData) {
            const passwordMatch = await pass.checkPassword(password,userData.password)
            if (passwordMatch) {
                if (userData.isBlocked === false) {
                    req.session.user = userData
                    res.redirect('/')
                } else {
                    res.render('user/login',{message:'Your were Blocked By Admin'})
                }
            } else {
                res.render('user/login',{message:'Invalid Data'})
            }
        } else {
            res.render('user/login',{message:'Invalid Data'})
        }
    } catch (error) {
        console.log(error.message);
    }
}


// this is for the main shop page to load


const loadShop = async(req,res)=>{
    try {
        
        const page = req.query.page || 1
        const perPage = 12

        const {sort} = req.query   
      
        const user=req.session.user
        const userId = req.session.user._id
        const cart = await Cart.findOne({userId})
        const cartCount = cart.products.length

        let productSort = Product.find({isPublish: true, isComing: false }).populate('category', 'name')
        

        if (sort === 'lowToHigh') {
            productSort = productSort.sort({price:1})
        }else if(sort === 'highToLow'){
            productSort = productSort.sort({price:-1})
        }

        const product = await productSort
        .skip((page-1)*perPage)
        .limit(perPage)
        
        
        
        const totalProducts = await Product.countDocuments()

        const totalPage = Math.ceil(totalProducts/perPage)
        res.render('user/shop',{
            product:product,
            user:user,
            cartCount:cartCount,
            totalPage,
            currentPage:page,
            sort
        })
        
    } catch (error) {
        console.log(error.message);
    }
}



// for viewing a specific product in detail


const loadDetailView = async(req,res)=>{
    try {
       
        const id = req.params.id
        const user=req.session.user
        const userId = req.session.user._id
        const productData = await Product.findById(id).populate('category','name')
        const products = await Product.find({isPublish:true,isComing:false}).limit(6)
        const cart = await Cart.findOne({userId})
        const cartCount = cart.products.length

        res.render('user/productDetail',{
            productDetail:productData,
            products:products,
            user:user,
            cartCount:cartCount
        })
    } catch (error) {
        console.log(error.message);
    }
}






const LoadForgetPassword = async(req,res)=>{
    try {
        res.render('user/forgetPassword')
    } catch (error) {
        console.log(error.message);
    }
}


const forgetPassword = async(req,res)=>{
    try {
        
        const email = req.body.email

        crypto.randomBytes(20,(err,buf)=>{
            if (err) {
            console.log(err.message);
        }
           return  token = buf.toString('hex')
        })
         
        const user = await User.findOne({email})
        console.log('///--'+user);

        if (!user) {
            // req.flash('message','email not found')
            res.redirect('/forgetPassword')
        }else{
        
        
        user.resetPasswordToken = token
        user.resetPasswordExpires = Date.now() + 3600000 // 1 hour
        
        await user.save() 
        await forgetOtp.sendOtp(email,token)

        res.render('user/forgetPassword',{
            message:'Check Your Mail'
        })
        }
    } catch (error) {
        console.log(error.message);
    }
}





const loadPasswordInput = async(req,res)=>{
    try {
        const user = await User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } })

        if (!user) {
            res.redirect('/forgetPassword',{ token: req.params.token })
        }
        if (user.resetPasswordExpires < Date.now()) {
            console.log('Token has expired');
            return res.redirect('/forgetPassword');
        }
        res.render('user/password')
    } catch (error) {
        console.log(error.message);
    }
}




const passwordInput = async(req,res)=>{
    try {
        const user = await User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } })

        if (!user) {
            res.redirect('/forgetPassword')
        }

        const sPassword = await pass.securePassword(req.body.password)
        console.log('///=='+user.password);
        user.password = sPassword
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;


        await user.save()
        res.redirect('/login')

    } catch (error) {                                                                                                       
        console.log(error.message);
    }
}



const loadProfile = async(req,res)=>{
    try {
        const userId = req.session.user._id
        const cart = await Cart.findOne({userId})
        const cartCount = cart.products.length

        const userData = await User.findById(userId)

        res.render('user/profileDashboard',{
            user:userData,
            cartCount:cartCount
        })
    } catch (error) {
        console.log(error.message);
    }
}


const loadProfileEdit = async(req,res)=>{
    try {
        
        const userId = req.session.user._id
        const cart = await Cart.findOne({userId})
        const cartCount = cart.products.length

        const userData = await User.findById(userId)
        res.render('user/profileEdit',{
            user:userData,
            cartCount:cartCount
        })
    } catch (error) {
        console.log(error);
    }
}


const submitProfileEdit = async(req,res)=>{
    try {
        const {userId} = req.params
        const {firstName,lastName,email,mobile} = req.body

        const userData = await User.findByIdAndUpdate(userId,{
            $set:{
                firstName:firstName,
                lastName:lastName,
                email:email,
                mobile:mobile
            }
        })

        await userData.save()
        res.redirect('/profileEdit')
    } catch (error) {
        console.log(error);
    }
}



const loadProfileAddress = async(req,res)=>{
    try {

        const userId = req.session.user._id
        const cart = await Cart.findOne({userId})
        const cartCount = cart.products.length

        const userData = await User.findById(userId)

        const userAddress = await Address.findOne({userId:userId})

        const address = userAddress ? userAddress.address : [];

        res.render('user/profileAddress',{
            user:userData,
            cartCount:cartCount,
            address:address
        })
    } catch (error) {
        console.log(error);
    }
}


const addAddress = async(req,res)=>{
    try {
        const {name,pincode,street,city,address,mobile} = req.body
        const {userId} = req.params
        
        let newAddress = {
            name:name,
            mobile:mobile,
            address:address,
            city:city,
            street:street,
            pincode:pincode

        }


        let userAddress = await Address.findOne({userId:userId})

        if (!userAddress) {
            newAddress.isDefault = true
            userAddress  = new Address({userId:userId,address:[newAddress]}) 
        }else{
            userAddress.address.push(newAddress)

            if (userAddress.address.length === 1) {
                userAddress.address[0].isDefault = true
            }
        }

        await userAddress.save()
            res.redirect('/profileAddress')

        
    } catch (error) {
        console.log(error.message);
    }
}



const editAddress = async(req,res)=>{
    try {
        const userId = req.session.user._id
        const {addressId} = req.params
        const {name,mobile,address,city,street,pincode} = req.body

        const updateAddress = await Address.findByIdAndUpdate({userId:userId,'address._id':addressId},{
            $set:{
                name:name,
                mobile:mobile,
                address:address,
                city:city,
                street:street,
                pincode:pincode
            }
        },{new:true})

        res.redirect('/profileAddress')

    } catch (error) {
        console.log(error);
    }
}





const loadProfileOrder = async(req,res)=>{
    try {
        const userId = req.session.user._id
        const cart = await Cart.findOne({userId})
        const cartCount = cart.products.length
        const userData = await User.findById(userId)

        const order = await Order.find({userId:userId}).populate({
            path: 'products.product',
            model: 'product' 
        });
        const orderCount = await Order.countDocuments()


        res.render('user/profileOrder',{
            user:userData,
            cartCount:cartCount,
            order:order,
            orderCount:orderCount
        })
    } catch (error) {
        console.log(error.message);
    }
}




const cancelOrder = async(req,res)=>{
    try {
        const {orderId} = req.params
console.log('/////////////////////////////////////');
        console.log(orderId);

        const orderData = await Order.findOneAndUpdate({
            orderId: orderId },{ $set: { orderStatus: 'cancelled' } }, 
            { new: true } 
        );
        if (orderData) {
            await orderData.save()
        }
        res.redirect('back')
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    homePage,
    loadLogin,
    loadSignup,
    insertUser,
    loadOtp,
    verifyOtp,
    VerifyLogin,
    loadShop,
    loadDetailView,
    logout,
    LoadForgetPassword,
    forgetPassword,
    passwordInput,
    loadPasswordInput,
    resendOtp,
    loadProfile,
    loadProfileEdit,
    submitProfileEdit,
    loadProfileAddress,
    addAddress,
    editAddress,
    loadProfileOrder,
    cancelOrder
}