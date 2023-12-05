const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    description:{
        type:String,
        required:true
    },
    image:{
        type:String
    },
    isListed:{
        type:Boolean,
        default:true,

    },
}, {
    timestamps: true
})


module.exports = mongoose.model('category',categorySchema)