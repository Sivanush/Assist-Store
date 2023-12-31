const mongoose = require('mongoose')

const wishistSchema = mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    products:[{
        product:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'product',
            required:true
        },
        size:{
            type:String,
            required:true
        },
        quantity:{
            type:Number,
            default:1
        }
    }]
})


module.exports = mongoose.model('wishlist',wishistSchema)

