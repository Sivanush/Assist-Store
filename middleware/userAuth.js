const User = require('../models/userModel')

const isLogin = async(req,res,next)=>{
    try {
        if (req.session.user) {
            const userData = await User.findById(req.session.user._id)
            if (userData&&userData.isBlocked===true) {
                res.redirect('/login')
            } else {
                next()
            }
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error.message);
    }
}




const isLogout = async(req,res,next)=>{
    try {
        if (req.session.user) {
            res.redirect('/')
        } else {
            next()
        }
    } catch (error) {
        console.log(error.message);
    }
}



module.exports ={
    isLogin,
    isLogout
}