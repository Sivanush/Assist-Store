const mongoose = require('mongoose')

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    totalStock: {
        XS: {
            type: Number,
            default: 0
        },
        S: {
            type: Number,
            default: 0
        },
        M: {
            type: Number,
            default: 0
        },
        L: {
            type: Number,
            default: 0
        },
        XL: {
            type: Number,
            default: 0
        },
        XXL: {
            type: Number,
            default: 0
        },
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        required: true
    },
    isPublish: {
        type: Boolean,
        default: true
    },
    image: [{
        type: String,
    }],
    hoverImage: {
        type: String,
        default: ''
    },
    mainImage: {
        type: String,
        default: ''
    },
    isComing: {
        type: Boolean,
        default: false
    },
    discount:{
        type:Number,
        default:0
    },
    discount:{
        type:Number,
        default:0
    },
    mainPrice:{
        type:Number,
        required:true
    }

}, {
    timestamps: true
})


module.exports = mongoose.model('product', productSchema)