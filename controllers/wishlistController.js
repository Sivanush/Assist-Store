const Wishlist = require('../models/wishlistModel')
const Product = require('../models/productModel')
const Cart = require('../models/cartModel')

const loadWishlist = async(req,res)=>{
    try {
        const user = req.session.user

        const wishlistProducts = await Wishlist.findOne({userId:req.session.user._id})
        .populate({
            path: 'products.product', 
            model: 'product' 
        });
        const extractedProducts = wishlistProducts.products.map((item) => item.product);
    
        const cart = await Cart.findOne({userId:req.session.user._id})
        const cartCount = cart ? cart.products.length : 0;

        res.render('user/wishlist',{
            user:user,
            products:extractedProducts,
            item:wishlistProducts,
            message:req.flash('message'),
            done:req.flash('done'),
            cartCount:cartCount
    })
    } catch (error) {
        console.log(error.message);
    }
}


const addWishlist = async(req,res)=>{
    try {
        console.log(req.body);
        const {productId} = req.params

        const {size} = req.body

        const userId = req.session.user._id
        const quantity = 1

        const product = await Product.findById(productId)
        if (product.totalStock.size < quantity) {
            
            res.redirect('/')
        }

        let wishlist = await Wishlist.findOne({
            userId:userId
        })

        if (!wishlist) {
            wishlist = new Wishlist({
                userId: userId,
                products: []
            })
        }

        const existingProduct = wishlist.products.find((products) => products.product == productId);
        if (existingProduct) {
           
            req.session.message = true
            setTimeout(() => {
                res.redirect('back')
            }, 800);
            
        }else{
           
           wishlist.products.push({
            product,
            size,
            
        })

        await wishlist.save()
      
        }

        

    } catch (error) {
        console.log(error.message);
    }
}




const removeProduct = async(req,res)=>{
    try {

        const {productId} = req.params

        const userId = req.session.user._id

        const wishlist = await Wishlist.findOne({userId:userId})
        
        if (wishlist) {
            const index = await wishlist.products.findIndex((product)=>product._id == productId)

            if (index) {
                console.log('Index:',index);
                wishlist.products.splice(index,1)
                await wishlist.save()
                res.redirect('back')
            } else {
                req.flash('message',"Please try Again")
                res.redirect('back')
            }
        } else {
            req.flash('message','The Wishlist is not Found. Please Try Again')
            res.redirect('back')
        }
    } catch (error) {
        console.log(error.message);
    }
}



const addToCartInWishlist = async (req, res) => {
    try {

        const {productId} = req.params
        const userId = req.session.user._id
        const Quantity = 1
        
        const {size} = req.body
       
        
        const wishlist = await Wishlist.findOne({userId:userId})
      


        const product = await Product.findById(productId)
        
        if (product.totalStock[size] < Quantity) {
            req.flash('message',"Out of Stock")
            res.redirect('back')
        }else{

            const indexInWishlist = wishlist.products.findIndex((product) => product.productId === productId);

            if (indexInWishlist) {
    
                wishlist.products.splice(indexInWishlist, 1);
    
                await wishlist.save();
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
            existingProduct.quantity += parseInt(Quantity)
        } else {
            cart.products.push({
                productId,
                size,
                quantity:Quantity
            })
        }

        await cart.save()
        req.flash('done',"done")
     res.redirect('back')
    }
    } catch (error) {
        console.log(error.message);
    }
}



module.exports = {
    loadWishlist,
    addWishlist,
    removeProduct,
    addToCartInWishlist
}