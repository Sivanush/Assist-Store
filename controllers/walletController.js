const User = require('../models/userModel')
const Cart = require('../models/cartModel')
const Wallet = require('../models/walletModel')
const Razorpay = require('razorpay');



const loadWallet = async(req,res)=>{
    try {
        const userId = req.session.user._id
        const cart = await Cart.findOne({userId})
        const cartCount = cart.products.length
        const userData = await User.findById(userId)
        
        

        const userWallet = await Wallet.findOne({userId:req.session.user._id})
        if (!userWallet) {
             await Wallet.create({
            userId:userId,
            amount:0,
            history: [{
                type: 'created',
                amount: 0,
                date: new Date(),
            }],
        })
        }

       
        


        res.render('user/profileWallet',{
            user:userData,
            cartCount:cartCount,
            userWallet,
            message:req.flash('message'),
            error:req.flash('error'),
            history:userWallet.history
        })
    } catch (error) {
        console.log(error.message);
    }
}


const addMoney = async(req,res)=>{
    try {
   
        const money = req.body.money
        const userId = req.session.user._id

        const razorpayInstance = new Razorpay({
            key_id: process.env.key_id,
             key_secret: process.env.key_secret,
        });

        let options = {
            amount: money * 100,  
            currency: "INR",
            receipt: "order_rcptid_11"
          };
          razorpayInstance.orders.create(options, function(err, order) {
            console.log(order);
            if (!err) {
                res.json (order)
            } else {
                res.json(err)
            }
          });   

          const walletData = await Wallet.findOne({userId:userId})

          if (walletData) {
            walletData.amount += parseInt(money) 
            walletData.history.push({
                type: 'credit',
                amount: parseInt(money),
                date: new Date(),
            })

            await walletData.save()
          }else{
            await Wallet.create({
                userId:userId,
                amount:parseInt(money),
                history: [{
                    type: 'credit',
                    amount: parseInt(money),
                    date: new Date(),
                }],
            })


          }




          res.redirect('back')
    } catch (error) {
        console.log(error.message);
    }
}


const debitMoney = async(req,res)=>{
    try {
        
        const money = req.body.money
        const userId = req.session.user._id

        const walletData = await Wallet.findOne({userId:userId})

        if (walletData) {

            if (parseInt(money) > walletData.amount) {
                req.flash('error', 'Insufficient balance for the withdrawal');
                return res.redirect('back');
            }


          walletData.amount -= parseInt(money) 
            walletData.history.push({
                type: 'debit',
                amount: parseInt(money),
                date: new Date(),
            })
            await walletData.save() 
            req.flash('message','Debited')
            res.redirect('back')
           
        }else{
          console.log('User Not Found!');
          req.flash('error','Please try Again')
          res.redirect('back')
        }
        
    } catch (error) {
        console.log(error.message);
    }
}






module.exports = {
    loadWallet,
    addMoney,
    debitMoney
}