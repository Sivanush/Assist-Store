const mongoose = require('mongoose')


const Cart = require('../models/cartModel')
const Wallet = require('../models/walletModel')
const Product = require('../models/productModel')
const Address = require('../models/addressModel')
const Order = require('../models/orderModel')
const Razorpay = require('razorpay');
const Coupon = require('../models/couponModel')
//load Cart page

const loadCart = async (req, res) => {
    try {


        const userId = req.session.user._id

        const cartpro = await Cart.findOne({
            userId
        })

        user = req.session.user
        let cart = await Cart.findOne({
                userId: userId
            })
            .populate('products.productId')
            .populate('coupon');


        if (!cart) {
            cart = await new Cart({
                userId: req.session.user._id,
                products: []
            })
            await cart.save()

        }
        cart.total = cart.products.reduce((total, products) => {
            return total + products.productId.price * products.quantity
        }, 0)



        if (cart.coupon) {
            cart.total = parseInt(cart.total - cart.coupon.discountAmount)
        }

        await cart.save()


        const cartCount = cartpro.products.length


        res.render('user/cart', {
            cart: cart,
            user,
            cartCount: cartCount,
            message:req.flash('message')
        })

    } catch (error) {
        console.log(error.message);
    }
}




const addToCart = async (req, res) => {
    try {

        const {
            productId
        } = req.params
        const {
            quantity,
            size
        } = req.body


        const userId = req.session.user._id

        const product = await Product.findById(productId)
        if (product.totalStock.size < quantity) {
            res.redirect('/')
        }

        let cart = await Cart.findOne({
            userId: userId
        })

        if (!cart) {
            cart = new Cart({
                userId: userId,
                products: []
            })
        }

        // Check if the product is already in the cart

        const existingProduct = cart.products.find((product) => product.productId == productId);


        if (existingProduct) {
            existingProduct.quantity += parseInt(quantity)
        } else {
            cart.products.push({
                productId,
                size,
                quantity
            })
        }

        await cart.save()
     

    } catch (error) {
        console.log(error.message);
    }
}

const removeProduct = async (req, res) => {
    try {
        const {
            productId
        } = req.params

        const userId = req.session.user._id

        const cart = await Cart.findOne({
            userId: userId
        })

        if (cart) {
            const index = await cart.products.findIndex((product) => {
                product.productId == productId
            })
            cart.products.splice(index, 1)
            await cart.save()
        }
        res.redirect('/cart')
    } catch (error) {
        console.log(error.message);
    }
}


const productQuantity = async (req, res) => {
    try {
        const {
            productId
        } = req.params
        const {
            quantity
        } = req.body
        const userId = req.session.user._id


        let cart = await Cart.findOne({
            userId: userId
        })
        // console.log('///~~~'+cart);

        if (cart) {
            const index = cart.products.findIndex((product) => product.productId == productId)

            if (index !== -1) {

                cart.products[index].quantity = quantity
                await cart.save()
            }
        }
        res.redirect('/cart')
    } catch (error) {
        console.log(error.message);
    }
}


const loadCheckout = async (req, res) => {
    try {
        const user = req.session.user
        const userId = req.session.user._id

        const userAddress = await Address.findOne({
            userId: userId
        })
        const address = userAddress ? userAddress.address : []

        const cart = await Cart.findOne({
            userId: userId
        }).populate('products.productId')
        const cartItems = cart.products

        const cartpro = await Cart.findOne({
            userId
        })
        const cartCount = cartpro.products.length

        res.render('user/checkout', {
            user,
            cartCount,
            address,
            cartItems,
            cart,
            error:req.flash('error'),
            success:req.flash('success'),
        })
    } catch (error) {
        console.log(error);
    }
}


const orderConfirm = async (req, res) => {
    try {
       
        const {
            paymentMethod
        } = req.body

        const userId = req.session.user._id

        const selectedAddress = req.body.addressInput


        const address = await Address.findOne({
            userId: userId
        });
        const foundAddress = address.address.find(addr => addr._id.toString() === selectedAddress.toString());



        const cart = await Cart.findOne({
            userId: userId
        }).populate('products');

        const product = cart.products.map(item => ({
            product: item.productId,
            quantity: item.quantity,
            size: item.size
        }))


        if (!foundAddress) {
            res.redirect('/')
        }



     


        if (req.body.paymentMethod === 'cod') {

            const newOrder = await Order.create({
                cart: cart,
                userId: userId,
                address: [foundAddress],
                paymentMethod: paymentMethod,
                products: product,
                paymentMethod: paymentMethod,
            });


            await newOrder.save()

            cart.coupon = undefined;
            cart.products = []
            await cart.save()
           
            res.redirect('/profileOrder')
        }

        if (req.body.paymentMethod === 'online') {

            const razorpayInstance = new Razorpay({
                key_id: process.env.key_id,
                key_secret: process.env.key_secret,
            });

            let options = {
                amount: cart.total * 100,
                currency: "INR",
                receipt: "order_rcptid_11"
            };
            razorpayInstance.orders.create(options, function (err, order) {
                console.log(order);
                if (!err) {
                    res.json(order)
                } else {
                    res.json(err)
                }
            });


            const newOrder = await Order.create({
                cart: cart,
                userId: userId,
                address: [foundAddress],
                paymentMethod: paymentMethod,
                products: product,
                paymentMethod: paymentMethod,
            });


            await newOrder.save()

            cart.coupon = undefined;
            cart.products = []
            await cart.save()

            
            res.redirect('/profileOrder')
        }if(req.body.paymentMethod === 'wallet'){
            
            const userWallet = await Wallet.findOne({userId:req.session.user._id})
            
            if (cart.total>userWallet.amount) {
                req.flash('error','Insufficient Money in the Wallet')
                res.redirect('back')
            }else{
                // userWallet.amount = userWallet.amount - cart.total

                userWallet.amount -= parseInt(cart.total) 
                userWallet.history.push({
                    type: 'debit',
                    amount: parseInt(cart.total),
                    date: new Date(),
                })
                await userWallet.save() 


                const newOrder = await Order.create({
                    cart: cart,
                    userId: userId,
                    address: [foundAddress],
                    paymentMethod: paymentMethod,
                    products: product,
                    paymentMethod: paymentMethod,
                });


                await newOrder.save()

                cart.coupon = undefined;
                cart.products = []
                await cart.save()
    
                req.flash('success','Order Placed')
                res.redirect('/profileOrder')
            }


          
        }

    } catch (error) {
        console.log(error.message);
    }
}



const orderDetail = async (req, res) => {
    try {
        const user = req.session.user
        const userId = req.session.user._id

        const {orderId} = req.params


        const cartpro = await Cart.findOne({
            userId
        })
        const cartCount = cartpro.products.length

        const orderDetail = await Order.findOne({
            orderId: orderId
        }).populate({
            path: 'products.product',
            model: 'product'
        })
        .populate({
            path:'cart.coupon',
            model:'coupon'
        })
        const err = (req.session.invalidReturn) ? 'Sorry return expired' : ''
        req.session.invalidReturn = null


        res.render('user/orderDetail', {
            cartCount,
            user,
            orderDetail,
            err,
            cancel:req.flash('cancel'),
            Return:req.flash('return')

        })
    } catch (error) {
        console.log(error.message);
    }
}






const applyCoupon = async (req, res) => {
    try {
        const user = req.session.user
        const userId = req.session.user._id
        const cartpro = await Cart.findOne({
            userId
        })
        const cartCount = cartpro.products.length
        let carts = await Cart.findOne({
                userId: userId
            })
            .populate('products.productId')
            .populate('coupon')

        const coupon = req.body.coupon

        const couponCode = await Coupon.findOne({
            code: coupon
        });

        if (!couponCode) {
            return res.render('user/cart', {
                cart: carts,
                user,
                cartCount: cartCount,
                message: 'Coupon Not found'
            })
        }
        if (couponCode.expireData < Date.now()) {
            req.flash('message', 'Coupon is Expired')
            res.redirect('back')
        }
        const cart = await Cart.findOne({
            userId: req.session.user._id
        })
        if (cart.total < couponCode.minimumOrder) {
            req.flash('message', 'Minimum order amount not met')
            res.redirect('back')
        }
        console.log(cart.total - couponCode.discountAmount);
        cart.coupon = couponCode._id
        cart.total = cart.total - couponCode.discountAmount
        await cart.save();

        req.flash('message', 'Coupon applied successfully')
        res.redirect('back')
    } catch (error) {
        console.log(error.message);
    }
}





module.exports = {
    loadCart,
    addToCart,
    removeProduct,
    productQuantity,
    loadCheckout,
    orderConfirm,
    orderDetail,
    applyCoupon
}