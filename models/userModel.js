const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    isBlocked:{
        type:Boolean,
        required:true
    },
    resetPasswordToken: {
        type: String,
        default: null,
    },
    resetPasswordExpires: {
        type: Date,
        default: null,
    },
    wallet:{
        type: Number,
        required:true,
        default:0
    },
    referralCode:{ 
        type:String,
        unique: true
    },
    referralBy:{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user'
    },
    isReferral:{
        type:Boolean,
        default:false
    }
}, {
    timestamps: true
})


module.exports = mongoose.model('user',userSchema);

