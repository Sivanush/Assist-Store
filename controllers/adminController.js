
const User = require('../models/userModel')
const Admin = require('../models/adminModel')
const pass = require('../helpers/spassword')





const loadLogin = async(req,res)=>{
    try {
        res.render('admin/login')
    } catch (error) {
        console.log(error.message);
    }
}


const insertLogin = async(req,res)=>{
    try {
        const {email,password} = req.body 
        console.log(req.body);
        const userData = await Admin.findOne({email:email})
        if (userData) {
            const sPassword = await pass.checkPassword(password,userData.password)
            if (sPassword) {
                req.session.admin = userData
                res.redirect('/admin')
            } else {
                 res.render('admin/login',{message:'Invalid a Data'})
            }
        } else {
            res.render('admin/login',{message:'Invalid Data'})
        }

    } catch (error) {
        console.log(error.message);
    }

}








const loadUsers = async(req,res)=>{
    try {
        const page = req.query.page || 1
        const perPage = 5

        const users = await User.find()
        .skip((page-1)*perPage)
        .limit(perPage)


        const totalUser = await User.countDocuments()

        const totalPage = Math.ceil(totalUser/perPage)

        res.render('admin/users',{
            users:users,
            totalPage,
            currentPage:page

        })
    } catch (error) {
        console.log(error.message);
    }
}

const blockUser = async(req,res)=>{
    try {

        const id = req.query.id
        const userData = await User.findByIdAndUpdate(id,
            {$set:{
                isBlocked:true
            }})
            res.redirect('/admin/users');
            } catch (error) {
        console.log(error.message);
    }
}


const unblockUser = async(req,res)=>{
    try {

        const id = req.query.id
        const userData = await User.findByIdAndUpdate(id,
            {$set:{
                isBlocked:false
            }})
            res.redirect('/admin/users');
            } catch (error) {
        console.log(error.message);
    }
}






















const loadDashboad = async(req,res)=>{
    try {
        res.render('admin/index')
    } catch (error) {
        console.log(error.message);
    }
}



const adminLogout = async(req,res)=>{
    try {
        
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    loadDashboad,
    loadUsers,
    blockUser,
    unblockUser,
    loadLogin,
    insertLogin,
    adminLogout
}