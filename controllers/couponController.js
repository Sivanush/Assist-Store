const { Code } = require('mongodb');
const Coupon = require('../models/couponModel')


const loadCoupon = async(req,res)=>{
    try {

        const page = req.query.page || 1
        const perPage = 1

        const coupon = await Coupon.find()
        .skip((page-1)*perPage)
        .limit(perPage)
        .exec()
        const totalCoupon = await Coupon.countDocuments()
        
        const totalPage = Math.ceil(totalCoupon/perPage)
        
        res.render('admin/coupon',{
            coupons:coupon,
            totalPage,
            currentPage:page,
            message:req.flash('message')
        })

    } catch (error) {
        console.log(error.message);
    }
}

const addCoupon = async(req,res)=>{
    try {
        const {code,discount,date,minimumAmount} = req.body

        const coupon = await Coupon.find()

        const existCode = await Coupon.findOne({code:code})
        if (existCode) {
           req.flash('message','This Name Is Already Used')
           res.redirect('back')
        }
        const inputDate = new Date(date);

        if (inputDate <= new Date()) {
            res.render('admin/coupon',{
                coupons:coupon,
                message:'The date is not valid'
            })
        }
        const couponData = new Coupon({
            code,
            discountAmount:discount,
            expireData: new Date(date),
            minimumOrder:minimumAmount
        })

        if (couponData) {
            await couponData.save()
        }

        res.redirect('back')
    } catch (error) {
        console.log(error.message);
    }
}


const editCoupons = async (req, res) => {
    try {
        const { id } = req.params;
    
        const { code, discount, date, minimumAmount } = req.body;

        
        const existingCoupon = await Coupon.findById(id);

       
        if (existingCoupon.code !== code) {
            const existData = await Coupon.findOne({ code });

            if (existData) {
                return res.json({ message: 'This Coupon Code is Already Exist' });
            }
        }

    
        existingCoupon.code = code;
        existingCoupon.discountAmount  = discount;
        existingCoupon.expireData = date;
        existingCoupon.minimumOrder = minimumAmount;

       
        await existingCoupon.save();

        console.log('Coupon updated successfully:', existingCoupon);

        res.redirect('/admin/coupon');
    } catch (error) {
        console.error('Error updating coupon:', error.message);
        res.status(500).send('Internal Server Error');
    }
};


    const unPublish = async (req,res)=>{
        try {
            const {id} = req.params

            const updateData = await Coupon.findByIdAndUpdate(id,{
                $set:{
                    isActive:false
                }
            })
            res.redirect('back')
        } catch (error) {
            console.log(error.message);
        }
    }


    const publish = async (req,res)=>{
        try {
            const {id} = req.params
            console.log('//////',id);
            const updateData = await Coupon.findByIdAndUpdate(id,{
                $set:{
                    isActive:true
                }
            })
            res.redirect('back')
        } catch (error) {
            console.log(error.message);
        }
    }

module.exports = {
    loadCoupon,
    addCoupon,
    editCoupons,
    unPublish,
    publish
}