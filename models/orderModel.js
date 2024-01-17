const mongoose = require('mongoose')



const orderSchema = mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    cart:{ 
        type:Object
    },
    orderId:{
        type:String,
        default:function() {
            return  Math.floor(100000 + Math.random() * 900000).toString()
        }
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
    }],
    products:[{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product', 
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        size: {
            type: String,
            required: true
        }
    }],
    paymentMethod:{
        type:String,
        enum:['cod','online','wallet'],
        required:true
    },
    orderStatus:{
        type:String,
        enum:['pending', 'shipped', 'delivered', 'cancelled','returned'],
        default:'pending',
        required:true
    },
    return:{
        type:Boolean,
        default:false
    },
    reason:{
        type:String,
        
    }

},
{
    timestamps:true
}
)



module.exports = mongoose.model('order',orderSchema)