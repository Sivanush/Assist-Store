const mongoose = require('mongoose')

const addressSchema = mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    address:[{
        name:{
            type:String,
            required:true
        },
        mobile:{
            type:Number,
            required:true
        },
        address:{
            type:String,
            required:true
        },
        city:{
            type:String,
            required:true
        },
        street:{
            type:String,
            required:true
        },
        pincode:{
            type:Number,
            required:true
        },
        isDefault:{
            type:Boolean,
            default:false
        }
    }]
})

module.exports = mongoose.model('address',addressSchema)