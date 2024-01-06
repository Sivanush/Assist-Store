const Order = require('../models/orderModel')

const loadOrder = async (req,res)=>{
    try {

        
        const page = req.query.page || 1
        const perPage = 5


        const order = await Order.find()
        .sort({ createdAt: -1 })
        .skip((page-1)*perPage)
        .limit(perPage)
        .exec()

        const totalOrder = await Order.countDocuments()
        
        const totalPage = Math.ceil(totalOrder/perPage)

        res.render('admin/order',{
            order,
            totalPage,
            currentPage:page
        })
    } catch (error) {
        console.log(error.message);
    }
}





const loadOrderDetail = async (req,res)=>{
    try {
        const {orderId} = req.params

        console.log(orderId);

        const orderDetail = await Order.findById(orderId).populate({
            path: 'products.product',
            model: 'product' 
        })

        console.log(orderDetail);

        res.render('admin/orderDetail',{
            orderDetail
        })
    } catch (error) {
        console.log(error.message);
    }
}



const statusChange = async(req,res)=>{
    try {
  
        const {orderId} = req.params

        const {status} = req.body

        const orderData = await Order.findByIdAndUpdate(orderId,{
            $set:{
                orderStatus:status
            }
           
        })
        if (orderData) {
              res.redirect('back')
        }
      
    } catch (error) {
        console.log(error.message);
    }
}








module.exports = {
    loadOrder,
    loadOrderDetail,
    statusChange
}