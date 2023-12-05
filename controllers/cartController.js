const Cart = require('../models/cartModel')
const Product = require('../models/productModel')

//load Cart page

const loadCart = async (req,res)=>{ 
    try {
        const userId = req.session.user._id

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
        
            
                
            res.render('user/cart',{cart:cart,user})

    } catch (error) {
        console.log(error.message);
    }
}




const addToCart = async (req,res)=>{
    try {
    
        const { productId } = req.params
        const {quantity,size} = req.body
        console.log('quantity,size',quantity,size);

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
            existingProduct.quantity += quantity
        } else {
            cart.products.push({productId,size,quantity})
        }

        await cart.save()
        

        res.redirect('/cart');

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
            const index = cart.products.findIndex((product)=>{
               return product.productId == productId
            }) 
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









module.exports = {
    loadCart,
    addToCart,
    removeProduct,
    productQuantity
}