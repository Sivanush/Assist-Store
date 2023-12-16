const mongoose = require('mongoose')


const Cart = require('../models/cartModel')
const Product = require('../models/productModel')
const Address = require('../models/addressModel')
const Order = require('../models/orderModel')


//load Cart page

const loadCart = async (req,res)=>{ 
    try {
        
        const userId = req.session.user._id
        
        const cartpro = await Cart.findOne({userId})
        
        user = req.session.user

        let cart = await Cart.findOne({userId:userId}).populate('products.productId')
        
        if (!cart) {
            cart = await new Cart({userId:req.session.user._id,products:[]})
            await cart.save()
            
        }
            cart.total  = cart.products.reduce((total,products)=>{
               return total+products.productId.price * products.quantity
            },0)

            await cart.save()
        
            
            const cartCount = cartpro.products.length

            
            res.render('user/cart',{
                cart:cart,
                user,
                cartCount:cartCount
            })

    } catch (error) {
        console.log(error.message);
    }
}




const addToCart = async (req,res)=>{
    try {
    
        const { productId } = req.params
        const {quantity,size} = req.body
        

        const userId = req.session.user._id

        const product = await Product.findById(productId)
        if (product.totalStock.size < quantity) {
            res.redirect('/')
        }

        let cart = await Cart.findOne({userId:userId})

        if (!cart) {
            cart = new Cart({userId:userId,products:[]})
        }

        // Check if the product is already in the cart

        const existingProduct = cart.products.find((product) => product.productId == productId);
 

        if (existingProduct) {
            existingProduct.quantity += parseInt(quantity)
        } else {
            cart.products.push({productId,size,quantity})
        }

        await cart.save()
        

        // res.redirect('/cart');
       setTimeout(() => {
        res.redirect('back');
       }, 1000);

    } catch (error) {
        console.log(error.message);
    }
}

const removeProduct = async(req,res)=>{
    try {
        const {productId} = req.params
        
        const userId = req.session.user._id

        const cart = await Cart.findOne({userId:userId})

        if (cart) {
            const index = await cart.products.findIndex((product)=>{
                product.productId == productId
            })
            cart.products.splice(index,1)
            await cart.save()
        }
        res.redirect('/cart')
    } catch (error) {
        console.log(error.message);
    }
}


const productQuantity = async(req,res)=>{
    try {
        const {productId} = req.params
        const {quantity} = req.body
        const userId = req.session.user._id
        

        let cart = await Cart.findOne({userId:userId})
        // console.log('///~~~'+cart);

        if (cart) {
            const index = cart.products.findIndex((product)=> product.productId == productId) 
            
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


const loadCheckout = async (req,res)=>{
    try {
        const user = req.session.user
        const userId = req.session.user._id

        const userAddress = await Address.findOne({userId:userId})
        const address = userAddress ? userAddress.address : []

        const cart = await Cart.findOne({userId:userId}).populate('products.productId')
        const cartItems = cart.products

        const cartpro = await Cart.findOne({userId})
        const cartCount = cartpro.products.length

        res.render('user/checkout',{
            user,
            cartCount,
            address,
            cartItems,
            cart
        })
    } catch (error) {
        console.log(error);
    }
} 


const orderConfirm = async(req,res)=>{
    try {
        const {paymentMethod} = req.body

        const userId = req.session.user._id

        const selectedAddress = req.body.addressInput

        const address = await Address.findOne({userId:userId});
        const foundAddress = address.address.find(addr => addr._id.toString() === selectedAddress.toString());

       

        const cart = await Cart.findOne({userId:userId}).populate('products');

         const product = cart.products.map(item=>({
            product:item.productId,
            quantity:item.quantity,
            size:item.size
         })) 
     

        if (!foundAddress) {
            res.redirect('/')
        }

        const existingOrder = await Order.find({userId:userId})
        
        if (existingOrder) {
            
        }

        const newOrder = await Order.create({
            cart:cart,
            userId: userId,
            address: [foundAddress],
            paymentMethod: paymentMethod,
            products: product,
            paymentMethod: paymentMethod,
        });
        


        await newOrder.save()

         cart.products = []
         await cart.save()

        res.redirect('/profileOrder')
    } catch (error) {
        console.log(error.message);
    }
}



const orderDetail = async (req,res)=>{
    try {
        const user = req.session.user
        const userId = req.session.user._id

        const {orderId} = req.params


        const cartpro = await Cart.findOne({userId})
        const cartCount = cartpro.products.length

        const orderDetail = await Order.findOne({orderId:orderId}).populate({
            path: 'products.product',
            model: 'product' 
        })
        
       

        res.render('user/orderDetail',{
            cartCount,
            user,
            orderDetail

        })
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
    orderDetail
}