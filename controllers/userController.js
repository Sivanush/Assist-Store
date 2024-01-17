const mongoose = require('mongoose')
const otp = require('../helpers/otp')
const forgetOtp = require('../helpers/forgetOtp')
const pass = require('../helpers/spassword')
const crypto = require('crypto')
const flash = require('connect-flash');
require('dotenv').config();
const easyinvoice = require('easyinvoice');

const User = require('../models/userModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModal')
const Cart = require('../models/cartModel')
const Address = require('../models/addressModel')
const Order = require('../models/orderModel')
const Wallet = require('../models/walletModel')
const Wishlist = require('../models/wishlistModel')
const res = require('express/lib/response')

// To load the home page

const homePage = async (req, res) => {
    try {

        let userdata = null;
        let cartCount = null
        if (req.session.user) {
            const userId = req.session.user._id;
            const cart = await Cart.findOne({
                userId
            });
            const cartCount = cart.products.length;

            userdata = await User.findById(userId);

            if (!userdata) {
                console.log('User not found');
            }
        }



        // const category = await Category.findOne({category:})
        const productData = await Product.find({
            isPublish: true,
            isComing: false
        }).sort({
            createdAt: -1
        }).limit(6)

        const categoryData = await Category.find({
            isListed: true
        }).limit(3)

        const comingData = await Product.find({
            isComing: true
        }).sort({
            createdAt: -1
        })

        const userData = req.session.user
        if (req.session.user == null) {
            res.render('index', {
                user: null,
                product: productData,
                category: categoryData,
                comingData: comingData
            })
        } else {
            res.render('index', {
                user: userData,
                product: productData,
                category: categoryData,
                comingData: comingData,
                user: userdata,
                cartCount: cartCount,
            })
        }

    } catch (error) {
        console.log(error.message);
    }
}



//for user to logout from the site

const logout = async (req, res) => {
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
            req.session.otpExpire = Date.now() + 60 * 1000

            console.log('OTP:' + req.session.otp);

            await otp.sendOtp(req.session.email, otpCode)

                .then((result) => {

                    res.redirect('/otp');
                    console.log(result);

                }).catch((err) => {

                    res.render('user/signup', {
                        message: 'error in otp or Server error please try again'
                    })
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


function generateUniqueReferralCode(length = 6) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let referralCode = 'REF';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        referralCode += characters.charAt(randomIndex);
    }

    return referralCode;
}


//to verify the user otp by crosschecking


const verifyOtp = async (req, res) => {
    try {
        const {
            one,
            two,
            three,
            four
        } = req.body
        const enteredOtp = `${one}${two}${three}${four}`
        const otp = req.session.otp
        const expireOtp = req.session.otpExpire

        console.log('Entered otp:', enteredOtp);
        console.log('session otp:', otp);

        if (otp === enteredOtp && Date.now() < expireOtp) {

            req.session.otp = null
            const userData = req.session.tempUser
            const spassword = await pass.securePassword(userData.password)
            const user = await User.create({

                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                mobile: userData.mobile,
                password: spassword,
                isBlocked: false,
                referralCode: generateUniqueReferralCode()

            })
            const userInfo = await user.save()
            if (userInfo) {
                req.session.user = user
                const cart = await new Cart({
                    userId: req.session.user._id,
                    products: []
                })
                await cart.save()

                const wishlist = new Wishlist({
                    userId: req.session.user._id,
                    products: []
                })
                await wishlist.save()

                await Wallet.create({
                    userId: req.session.user._id,
                    amount: 0,
                    history: [{
                        type: 'created',
                        amount: 0,
                        date: new Date(),
                    }]
                })


                res.redirect('/login')
            } else {
                res.render('404error')
            }
        } else {
            res.render('user/otp', {
                message: 'Incorrect OTP or Expired OTP. Please try again.'
            });
        }
    } catch (error) {
        console.log(error.message);
    }
}









const resendOtp = async (req, res) => {
    try {

        const email = req.session.email

        if (req.session.otp || req.session.otpExpire < Date.now()) {
            const otpCode = otp.generate()
            req.session.otp = otpCode
            req.session.otpExpire = Date.now() + 60 * 1000
            console.log('New Entered Otp' + otpCode);
            await otp.sendOtp(email, otpCode)
                .then((result) => {
                    console.log(result);
                    res.redirect('/otp')
                })
                .catch((err) => {
                    console.log(err);
                    res.render('user/signup', {
                        message: 'error in otp'
                    })
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

const VerifyLogin = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body
        const userData = await User.findOne({
            email: email
        })
        if (userData) {
            const passwordMatch = await pass.checkPassword(password, userData.password)
            if (passwordMatch) {
                if (userData.isBlocked === false) {
                    if (!userData.referralCode) {
                        userData.referralCode = generateUniqueReferralCode()
                        req.session.user = userData
                        console.log(generateUniqueReferralCode());
                        res.redirect('/')
                    } else {
                        req.session.user = userData
                        console.log(generateUniqueReferralCode());
                        res.redirect('/')
                    }
                } else {
                    res.render('user/login', {
                        message: 'Your were Blocked By Admin'
                    })
                }
            } else {
                res.render('user/login', {
                    message: 'Invalid Data'
                })
            }
        } else {
            res.render('user/login', {
                message: 'Invalid Data'
            })
        }
    } catch (error) {
        console.log(error.message);
    }
}


// this is for the main shop page to load


const loadShop = async (req, res) => {
    try {

        const page = req.query.page || 1
        const perPage = 12

        const {sort} = req.query

        const userId = req.session.user ? req.session.user._id : null;

        const cart = await Cart.findOne({
            userId
        })
        const cartCount = cart ? cart.products.length : 0;

        let totalPage
        let k
        let productSearch;
        let product
       
        const search = async (data) => {
            try {
                const products = await Product.find({
                    name: { $regex: new RegExp(data, 'i') }
                }).populate('category', 'name')
                   
        
                return products;
            } catch (error) {
                console.log('error in the search');
                throw error;
            }
        };

        let categoryCounts = {}


        if (req.query.search) {
            productSearch= await search(req.query.search);
            console.log('........');
            if (req.xhr) {
               console.log(productSearch.length);
                return res.json({
                    product: productSearch, 
                   
                });
                
            }
        } else if (req.query.categories) {


            // const selectedCategories = Array.isArray(req.query.categories) ? req.query.categories : [req.query.categories];

            // // console.log(selectedCategories);

            // productSearch = Product.find({
            //     isPublish: true,
            //     isComing: false,
            //     category: {
            //         $in: selectedCategories
            //     },
            // }).populate('category', 'name');

            // product = await productSearch
            //     .skip((page - 1) * perPage)
            //     .limit(perPage)

            k=1

            // const selectedCategories = Array.isArray(req.query.categories) ? req.query.categories : [req.query.categories];
            const selectedCategories = Array.isArray(req.query.categories)
    ? req.query.categories
    : req.query.categories.split(',');

            productSearch = Product.find({
                isPublish: true,
                isComing: false,
                category: { $in: selectedCategories }
            }).populate('category', 'name');

            product = await productSearch
                .skip((page - 1) * perPage)
                .limit(perPage);


                const productCount = await Product.countDocuments({
                    isPublish: true,
                    isComing: false,
                    category: { $in: selectedCategories }
                });


                totalPage = Math.ceil(productCount / perPage)
                



        } else {
            productSearch = Product.find({
                isPublish: true,
                isComing: false
            }).populate('category', 'name')

            if (sort === 'lowToHigh') {
                k=2
                productSearch = productSearch.sort({
                    mainPrice: 1
                })
            } else if (sort === 'highToLow') {
                k=2
                productSearch = productSearch.sort({
                    mainPrice: -1
                })
            }

            product = await productSearch
                .skip((page - 1) * perPage)
                .limit(perPage)


                const totalProducts = await Product.countDocuments()
                totalPage = Math.ceil(totalProducts / perPage)
        }


        const allCategories = await Category.find()
        allCategories.forEach(async (category) => {
            const count = await Product.countDocuments({
                category: category._id,
                isPublish: true,
                isComing: false,
            });
            categoryCounts[category._id] = count;
        })





        const categories = await Category.find()

        
    
        


      

        const selectedCategory = req.query.categories;
       
        res.render('user/shop', {
            product: product,
            user: req.session.user,
            cartCount: cartCount,
            totalPage,
            currentPage: page,
            sort,
            categories,
            categoryCounts,
            category: req.query.category,
            search: req.query.search,
            selectedCategory,
            k
        })

    } catch (error) {
        console.log(error.message);
    }
}



// for viewing a specific product in detail


const loadDetailView = async (req, res) => {
    try {

        const id = req.params.id


        const userId = req.session.user ? req.session.user._id : null;

        const productData = await Product.findById(id).populate('category', 'name')
        const products = await Product.find({
            isPublish: true,
            isComing: false
        }).limit(6)
        const cart = await Cart.findOne({
            userId
        })
        const cartCount = cart ? cart.products.length : 0;


        const message = (req.session.message) ? 'error' : ''
        console.log('////', message);
        req.session.message = null

        res.render('user/productDetail', {
            productDetail: productData,
            products: products,
            user: req.session.user,
            cartCount: cartCount,
            message

        })
    } catch (error) {
        console.log(error.message);
    }
}






const LoadForgetPassword = async (req, res) => {
    try {
        res.render('user/forgetPassword')
    } catch (error) {
        console.log(error.message);
    }
}


const forgetPassword = async (req, res) => {
    try {

        const email = req.body.email

        crypto.randomBytes(20, (err, buf) => {
            if (err) {
                console.log(err.message);
            }
            return token = buf.toString('hex')
        })

        const user = await User.findOne({
            email
        })
        console.log('///--' + user);

        if (!user) {
            // req.flash('message','email not found')
            res.redirect('/forgetPassword')
        } else {


            user.resetPasswordToken = token
            user.resetPasswordExpires = Date.now() + 3600000 // 1 hour

            await user.save()
            await forgetOtp.sendOtp(email, token)

            res.render('user/forgetPassword', {
                message: 'Check Your Mail'
            })
        }
    } catch (error) {
        console.log(error.message);
    }
}





const loadPasswordInput = async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: {
                $gt: Date.now()
            }
        })

        if (!user) {
            res.redirect('/forgetPassword', {
                token: req.params.token
            })
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




const passwordInput = async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: {
                $gt: Date.now()
            }
        })

        if (!user) {
            res.redirect('/forgetPassword')
        }

        const sPassword = await pass.securePassword(req.body.password)
        console.log('///==' + user.password);
        user.password = sPassword
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;


        await user.save()
        res.redirect('/login')

    } catch (error) {
        console.log(error.message);
    }
}



const loadProfile = async (req, res) => {
    try {
        const userId = req.session.user._id
        const cart = await Cart.findOne({
            userId
        })
        const cartCount = cart.products.length

        const userData = await User.findById(userId)



        res.render('user/profileDashboard', {
            user: userData,
            cartCount: cartCount,
            message: req.flash('message'),
            done: req.flash('done')
        })
    } catch (error) {
        console.log(error.message);
    }
}

const loadProfileEdit = async (req, res) => {
    try {

        const userId = req.session.user._id
        const cart = await Cart.findOne({
            userId
        })
        const cartCount = cart.products.length

        const userData = await User.findById(userId)
        res.render('user/profileEdit', {
            user: userData,
            cartCount: cartCount
        })
    } catch (error) {
        console.log(error);
    }
}


const submitProfileEdit = async (req, res) => {
    try {
        const {
            userId
        } = req.params
        const {
            firstName,
            lastName,
            email,
            mobile
        } = req.body

        const userData = await User.findByIdAndUpdate(userId, {
            $set: {
                firstName: firstName,
                lastName: lastName,
                email: email,
                mobile: mobile
            }
        })

        await userData.save()

        setTimeout(() => {
            res.redirect('/profileEdit')
        }, 750);


    } catch (error) {
        console.log(error);
    }
}



const loadProfileAddress = async (req, res) => {
    try {

        const userId = req.session.user._id
        const cart = await Cart.findOne({
            userId
        })
        const cartCount = cart.products.length

        const userData = await User.findById(userId)

        const userAddress = await Address.findOne({
            userId: userId
        })

        const address = userAddress ? userAddress.address : [];

        res.render('user/profileAddress', {
            user: userData,
            cartCount: cartCount,
            address: address
        })
    } catch (error) {
        console.log(error);
    }
}


const addAddress = async (req, res) => {
    try {

        const {
            name,
            pincode,
            street,
            city,
            address,
            mobile
        } = req.body
        const {
            userId
        } = req.params

        let newAddress = {
            name: name,
            mobile: mobile,
            address: address,
            city: city,
            street: street,
            pincode: pincode

        }


        let userAddress = await Address.findOne({
            userId: userId
        })

        if (!userAddress) {
            newAddress.isDefault = true
            userAddress = new Address({
                userId: userId,
                address: [newAddress]
            })
        } else {
            userAddress.address.push(newAddress)

            if (userAddress.address.length === 1) {
                userAddress.address[0].isDefault = true
            }
        }

        await userAddress.save()
        res.redirect('back')


    } catch (error) {
        console.log(error.message);
    }
}



const editAddress = async (req, res) => {
    try {

        const {
            addressId
        } = req.params
        const {
            name,
            mobile,
            address,
            city,
            street,
            pincode
        } = req.body

        const userAddress = await Address.findOne({
            userId: req.session.user._id
        })

        const addressIndex = userAddress.address.findIndex(addr => addr._id.toString() === addressId)

        if (addressIndex !== -1) {
            console.log(addressIndex, '/////');
            userAddress.address[addressIndex].name = name;
            userAddress.address[addressIndex].mobile = mobile;
            userAddress.address[addressIndex].address = address;
            userAddress.address[addressIndex].city = city;
            userAddress.address[addressIndex].street = street;
            userAddress.address[addressIndex].pincode = pincode;

            // Save the updated document
            await userAddress.save();
            res.redirect('back')

        } else {
            res.json('error')
        }




    } catch (error) {
        console.log(error);
    }
}

const deleteAddress = async (req, res) => {
    try {
        const {
            addressId
        } = req.params

        const userAddress = await Address.findOne({
            userId: req.session.user._id
        })

        const addressIndex = userAddress.address.findIndex(addr => addr._id.toString() === addressId)
        if (addressIndex !== -1) {


            userAddress.address.splice(addressIndex, 1)
            await userAddress.save()

            res.redirect('back')
        }




    } catch (error) {
        console.log(error.message);
    }
}



const loadProfileOrder = async (req, res) => {
    try {

        const page = req.query.page || 1
        const perPage = 3




        const userId = req.session.user._id
        const cart = await Cart.findOne({
            userId
        })
        const cartCount = cart.products.length
        const userData = await User.findById(userId)

        const order = await Order.find({
                userId: userId
            })
            .populate({
                path: 'products.product',
                model: 'product'
            })
            .sort({
                createdAt: -1
            })
            .skip((page - 1) * perPage)
            .limit(perPage)


        // await order.reverse()
        const orderCount = await Order.countDocuments()

        const totalPage = Math.ceil(orderCount / perPage)
        res.render('user/profileOrder', {
            user: userData,
            cartCount: cartCount,
            order: order,
            orderCount: orderCount,
            totalPage,
            currentPage: page,
          
        })
    } catch (error) {
        console.log(error.message);
    }
}




const cancelOrder = async (req, res) => {
    try {
        const {
            orderId
        } = req.params
        console.log('//////////////////////////////////');

        console.log(req.body.reason);
        const orderData = await Order.findOneAndUpdate({
            orderId: orderId
        }, {
            $set: {
                orderStatus: 'cancelled',
                reason: req.body.reason
            }
        }, {
            new: true
        });
        if (orderData) {
            if (orderData.paymentMethod === 'online') {
                const user = await User.findById(orderData.userId);
                if (user) {
                    const userWallet = await Wallet.findOne({
                        userId: req.session.user._id
                    })

                    userWallet.amount += orderData.cart.total;
                    await userWallet.save();
                } else {
                    console.log('User Not Found');
                }
            }
            await orderData.save()
        }
        req.flash('cancel', 'Order Cancelled!')
        res.redirect('back')
    } catch (error) {
        console.log(error.message);
    }
}


const returnOrder = async (req, res) => {
    try {

        const {
            orderId
        } = req.params

        const orderData = await Order.findOne({
            orderId: orderId
        })

        const returnDeadLine = new Date(orderData.createdAt)
        returnDeadLine.setDate(returnDeadLine.getDate() + 7)

        if (new Date() > returnDeadLine) {
            req.session.invalidReturn = true
            res.redirect('back')
        } else {
            orderData.return = true
            orderData.orderStatus = 'returned',
                orderData.reason = req.body.reason


            if (orderData.paymentMethod === 'online') {
                const user = await User.findById(orderData.userId);
                if (user) {
                    const userWallet = await Wallet.findOne({
                        userId: req.session.user._id
                    })

                    userWallet.amount += orderData.cart.total;
                    await userWallet.save();
                } else {
                    console.log('User Not Found');
                }
            }
            await orderData.save()


            await orderData.save()
            req.flash('return', 'Order Return!')
            res.redirect('back')
        }

    } catch (error) {
        console.log(error.message);
    }
}


const getOrderDetails = async (orderId) => {

    const order = await Order.findOne({
        orderId: orderId
    }).populate('products.product').populate({
        path: 'cart.coupon',
        model: 'coupon'
    })
    console.log('////////////' + order.cart.coupon);
    if (!order) {

        return res.status(500).redirect('/404');
    }

    return {
        clientName: order.address[0].name,
        clientAddress: order.address[0].address,
        clientStreet: order.address[0].street,
        clientCity: order.address[0].city,
        clientPlace: order.address[0].address,
        clientZip: order.address[0].pincode,
        invoiceNumber: orderId,
        invoiceDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),

        products: order.products.map(product => ({

            "quantity": product.quantity,
            "description": product.product.name,
            "tax-rate": 0,
            "price": product.product.price,


        })),



    };
};


const generateInvoice = async (orderId) => {
    try {
        console.log(orderId);
        const orderDetail = await getOrderDetails(orderId)


        const data = {
            "currency": "USD",
            "marginTop": 25,
            "marginRight": 25,
            "marginLeft": 25,
            "marginBottom": 25,
            "images": {
                // The logo on top of your invoice
                "logo": "https://public.budgetinvoice.com/img/logo_en_original.png",
            },
            "sender": {
                "company": "Assist Store",
                "address": "Madrid,Spain",
                "zip": "123456",
                "city": "Madrid",
                "country": "Spain"
            },
            "client": {
                "company": orderDetail.clientName,
                "address": orderDetail.clientAddress,
                "city": orderDetail.clientCity,
                "country": orderDetail.clientStreet,
                "zip": orderDetail.clientZip,
            },
            "information": {
                "number": orderId,
                "date": new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
            },

            "products": orderDetail.products,

            "bottom-notice": "Thanks for shopping from Assist Store",

        };

        const result = await easyinvoice.createInvoice(data)
        console.log(data);

        const pdfBuffer = Buffer.from(result.pdf, 'base64')

        return pdfBuffer;

    } catch (error) {
        console.log(error.message);
    }
}


const orderInvoicePdf = async (req, res) => {
    try {

        const orderId = req.params.orderId;
        console.log(orderId);

        const pdfBuffer = await generateInvoice(orderId);

        // Send the PDF as a response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=invoice' + orderId + '.pdf');
        res.send(pdfBuffer);



    } catch (error) {
        console.log(error.message);
        throw error
    }
}




const referralPost = async (req, res) => {
    try {
        const {
            referralCode
        } = req.body


        const userId = req.session.user._id
        const userData = await User.findById(userId)

        const referredByUser = await User.findOne({
            referralCode
        });

        if (userData.referralCode === referralCode) {
            req.flash('message', 'You Cannot Use Your Referral Code')
            res.redirect('back')
        }

        const userWallet = await Wallet.findOne({
            userId
        });
        userWallet.amount += 100;
        userWallet.history.push({
            type: 'credit',
            amount: 100,
            date: new Date(),
        });
        await userWallet.save();


        const refWallet = await Wallet.findOne({
            userId: referredByUser._id
        });
        refWallet.amount += 200;
        refWallet.history.push({
            type: 'credit',
            amount: 200,
            date: new Date(),
        });
        req.flash('done', 'You have Credited $100')
        await refWallet.save();

        await User.findByIdAndUpdate(userId, {
            referralBy: referredByUser._id,
            isReferral: true
        });


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
    cancelOrder,
    returnOrder,
    deleteAddress,
    orderInvoicePdf,
    referralPost
}