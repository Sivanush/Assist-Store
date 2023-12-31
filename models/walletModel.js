const mongoose = require('mongoose')

const walletSchema = mongoose.Schema({
    userId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'user',
      required:true  
    },
    amount:{
        type:Number,
        default:0
    },
    history:[{
        type: {
            type: String,
            enum:['credit', 'debit','created'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    }]
},
{
    timestamps:true
})


module.exports = mongoose.model('wallet',walletSchema)