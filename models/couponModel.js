const mongoose = require('mongoose')

const couponSchema = mongoose.Schema({
    code:{
        type:String,
        required:true,
        unique:true
    },
    discountAmount:{
        type:Number,
        required:true
    },
    expireData:{
        type:Date,
        required:true
    },
    isActive:{
        type:Boolean,
        default:true
    },
    minimumOrder:{
        type:Number,
        required:true
    }
},
{
    timestamps:true
})


module.exports = mongoose.model('coupon',couponSchema)