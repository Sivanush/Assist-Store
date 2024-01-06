
const User = require('../models/userModel')
const Admin = require('../models/adminModel')
const pass = require('../helpers/spassword')
const Order = require('../models/orderModel')
const Product = require('../models/productModel')
const { get } = require('mongoose');
const Category = require('../models/categoryModal')



const PDFDocument = require('pdfkit');
const fs = require('fs');
const ExcelJS = require('exceljs');



const loadLogin = async(req,res)=>{
    try {
        res.render('admin/login')
    } catch (error) {
        console.log(error.message);
    }
}


const insertLogin = async(req,res)=>{
    try {
        const {email,password} = req.body 
        console.log(req.body);
        const userData = await Admin.findOne({email:email})
        if (userData) {
            const sPassword = await pass.checkPassword(password,userData.password)
            if (sPassword) {
                req.session.admin = userData
                res.redirect('/admin')
            } else {
                 res.render('admin/login',{message:'Invalid a Data'})
            }
        } else {
            res.render('admin/login',{message:'Invalid Data'})
        }

    } catch (error) {
        console.log(error.message);
    }

}








const loadUsers = async(req,res)=>{
    try {
       
        const page = req.query.page || 1
        const perPage = 5

        let users

        const userSearch = async (name) => {
            try {
                users = await User.find({$or: [
                    { firstName: { $regex: new RegExp(name, 'i') } },
                    { lastName: { $regex: new RegExp(name, 'i') } }
                ] })
              return users;
            } catch (error) {
              throw error;
            }
          }
          
        if (req.query.search) {
       
            users = await userSearch(req.query.search)
            if (req.xhr) {
                
                return res.json({ users:users });
                
              }
            
        } else {
            
            users = await User.find()
            .skip((page-1)*perPage)
            .limit(perPage)
        }
        
       


        const totalUser = await User.countDocuments()

        const totalPage = Math.ceil(totalUser/perPage)

        res.render('admin/users',{
            users:users,
            totalPage,
            currentPage:page,
            search: req.query.search || ''
        })
    } catch (error) {
        console.log(error.message);
    }
}

const blockUser = async(req,res)=>{
    try {

        const id = req.query.id
        const userData = await User.findByIdAndUpdate(id,
            {$set:{
                isBlocked:true
            }})
            res.redirect('/admin/users');
            } catch (error) {
        console.log(error.message);
    }
}


const unblockUser = async(req,res)=>{
    try {

        const id = req.query.id
        const userData = await User.findByIdAndUpdate(id,
            {$set:{
                isBlocked:false
            }})
            res.redirect('/admin/users');
            } catch (error) {
        console.log(error.message);
    }
}






















const loadDashboad = async(req,res)=>{
    try {

        const userCount = await User.find().countDocuments();
        
        const orderCount = await Order.find({ orderStatus: { $nin: ['returned', 'cancelled'] }}).countDocuments();

        const orders = await Order.find({ orderStatus: { $nin: ['returned', 'cancelled'] }});

        const totalRevenue = orders.reduce((acc, order) => {
            const orderTotal = order.cart ? order.cart.total : 0; 
            return acc + orderTotal;
        }, 0);



        const productCount = await Product.find().countDocuments();
        
        const currentDate = new Date()
        const currentMonth = currentDate.getMonth()+1
        const currentYear = currentDate.getFullYear()
        const currentDay = currentDate.getDate();

        const filterOrder = await Order.find({ orderStatus: { $nin: ['returned', 'cancelled'] },
            createdAt:{
                $gte: new Date(currentYear,currentMonth-1,1),
                $lte: new Date(currentYear,currentMonth,1)
            }
    })
  
    const MonthlyRevenue = await filterOrder.reduce((acc, order) => {
        const orderTotal = order.cart ? order.cart.total : 0;
        return acc + orderTotal;
    }, 0);

    const todayFilter = await Order.find({orderStatus:{$nin:['returned','cancelled']},
    createdAt: {
        $gte: new Date(currentYear, currentMonth - 1, currentDay, 0, 0, 0),
        $lt: new Date(currentYear, currentMonth - 1, currentDay + 1, 0, 0, 0)
    }
    })

    const todayRevenue =  await todayFilter.reduce((acc, order) => {
        const orderTotal = order.cart ? order.cart.total : 0;
        return acc + orderTotal;
    }, 0);

    
    const deliveredOrder = await Order.find({orderStatus:'delivered'}).countDocuments();

  



    const monthOrder = await Order.aggregate([{
        $match:{
            createdAt:{
                $gte:new Date(currentYear,0,1),
                $lte:new Date(currentYear+1,0,1)
            },
            orderStatus: 'delivered'
        },
    },
    {
        $group:{
            _id:{month:{$month:'$createdAt'}},
            count:{$sum:1}
        }
    }
])


        const resultWithZeros = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            count: 0
        }));
        
        // Fill in counts for existing months
        monthOrder.forEach(entry => {
            const index = entry._id.month - 1;
            resultWithZeros[index].count = entry.count;
        });
        // Step 1: Aggregate and store result in a temporary collection
        const catagoryCount = await Order.aggregate([
            {
                $match:{
                    orderStatus: 'delivered'
                },
            },
            {
                $unwind: '$products'
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.product',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            {
                $unwind: '$productInfo'
            },
            {
                $lookup: {
                    from: 'categories', // Replace 'categories' with the actual name of your category collection
                    localField: 'productInfo.category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            {
                $unwind: '$categoryInfo'
            },
            {
                $group: {
                    _id: '$categoryInfo.name', // Assuming 'name' is the field in the category collection that contains the category name
                    productCount: { $sum: '$products.quantity' }
                }
            }
        ]);
        
    
   
        res.render('admin/index',{
            userCount,
            orderCount,
            totalRevenue,
            productCount,
            MonthlyRevenue,
            todayRevenue,
            deliveredOrder,
            monthOrder:resultWithZeros,
            catagoryCount

        })
    } catch (error) {
        console.log(error.message);
    }
}





const generatePdf = async(req,res)=>{
    try {
        const reportType = req.query.reportType
        const doc = new PDFDocument()
       
        let writeStream = fs.createWriteStream(`report_${reportType}.pdf`);

        doc.pipe(writeStream);
        doc.fontSize(16).text(`Assist Store Report - ${reportType} Report`, 50, 50,{align:'center'});






        if (reportType === 'Weekly') {
           
            const startOfWeek = new Date();
            startOfWeek.setHours(0, 0, 0, 0);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

            const endOfWeek = new Date();
            endOfWeek.setHours(23, 59, 59, 999);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

         
                const orderCount = await Order.countDocuments({
                    createdAt: {
                        $gte: startOfWeek,
                        $lt: endOfWeek,
                    }
                });

                const orderCountDelivered = await Order.countDocuments({
                    orderStatus: 'delivered',
                    createdAt: {
                        $gte: startOfWeek,
                        $lt: endOfWeek,
                    }
                });

                const orderCountCancelled = await Order.countDocuments({
                    orderStatus: ['returned','cancelled'],
                    createdAt: {
                        $gte: startOfWeek,
                        $lt: endOfWeek,
                    }
                });

                const totalRevenue = await Order.aggregate([
                    {
                        $match: {
                            orderStatus: 'delivered',
                            createdAt: {
                                $gte: startOfWeek,
                                $lt: endOfWeek,
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: '$cart.total' }
                        }
                    }
                ]);

                


            if (doc) {
                const table = {
                    headers: ['Titles', 'Results'],
                    rows: [
                        ['Total Revenue', `$${totalRevenue[0].totalRevenue} `],
                        ['Total Orders', `${orderCount}`],
                        ['Total Delivered Order', `${orderCountDelivered}`],
                        ['Total Cancelled And Returned Order', `${orderCountCancelled}`],
                    ],
                };
            
                const tableTop = 120; // Adjust as needed
                const tableLeft = 80; // Adjust as needed
                const rowHeight = 20; // Adjust as needed
                const colWidth = 225; // Adjust as needed
                const headerHeight = 20; // Adjust as needed
                const textTopMargin = 5; // Adjust as needed
                const textLeftMargin = 10; // Adjust as needed
            
                doc.font('Helvetica-Bold');
                doc.fontSize(12);
            
                // Draw headers
                table.headers.forEach((header, i) => {
                    const xPosition = tableLeft + i * colWidth + textLeftMargin;
                    const yPosition = tableTop + textTopMargin;
            
                    doc.text(header, xPosition, yPosition).rect(tableLeft + i * colWidth, tableTop, colWidth, headerHeight).stroke();
                });
            
                // Draw rows
                table.rows.forEach((row, i) => {
                    row.forEach((cell, j) => {
                        const xPosition = tableLeft + j * colWidth + textLeftMargin;
                        const yPosition = tableTop + headerHeight + i * rowHeight + textTopMargin;
            
                        doc.text(cell, xPosition, yPosition).rect(tableLeft + j * colWidth, tableTop + headerHeight + i * rowHeight, colWidth, rowHeight).stroke();
                    });
                });
            } else {
                doc.text('No sales data available.');
            }






        }else if (reportType === 'Monthly') {
            const startOfMonth = new Date();
            startOfMonth.setHours(0, 0, 0, 0);
            startOfMonth.setDate(1);
        
            const endOfMonth = new Date(startOfMonth);
            endOfMonth.setMonth(endOfMonth.getMonth() + 1);
            endOfMonth.setDate(endOfMonth.getDate() - 1);
            endOfMonth.setHours(23, 59, 59, 999);
        
            const orderCount = await Order.countDocuments({
                createdAt: {
                    $gte: startOfMonth,
                    $lt: endOfMonth,
                }
            });
        
            const orderCountDelivered = await Order.countDocuments({
                orderStatus: 'delivered',
                createdAt: {
                    $gte: startOfMonth,
                    $lt: endOfMonth,
                }
            });
        
            const orderCountCancelled = await Order.countDocuments({
                orderStatus: ['returned', 'cancelled'],
                createdAt: {
                    $gte: startOfMonth,
                    $lt: endOfMonth,
                }
            });
        
            const totalRevenue = await Order.aggregate([
                {
                    $match: {
                        orderStatus: 'delivered',
                        createdAt: {
                            $gte: startOfMonth,
                            $lt: endOfMonth,
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$cart.total' }
                    }
                }
            ]);
            console.log(totalRevenue);
            if (doc) {
                const table = {
                    headers: ['Titles', 'Results'],
                    rows: [
                        ['Total Revenue', `$${totalRevenue[0].totalRevenue} `],
                        ['Total Orders', `${orderCount}`],
                        ['Total Delivered Order', `${orderCountDelivered}`],
                        ['Total Cancelled And Returned Order', `${orderCountCancelled}`],
                    ],
                };
        
                

                const tableTop = 120; // Adjust as needed
                const tableLeft = 80; // Adjust as needed
                const rowHeight = 20; // Adjust as needed
                const colWidth = 225; // Adjust as needed
                const headerHeight = 20; // Adjust as needed
                const textTopMargin = 5; // Adjust as needed
                const textLeftMargin = 10; // Adjust as needed
            
                doc.font('Helvetica-Bold');
                doc.fontSize(12);
            
                // Draw headers
                table.headers.forEach((header, i) => {
                    const xPosition = tableLeft + i * colWidth + textLeftMargin;
                    const yPosition = tableTop + textTopMargin;
            
                    doc.text(header, xPosition, yPosition).rect(tableLeft + i * colWidth, tableTop, colWidth, headerHeight).stroke();
                });
            
                // Draw rows
                table.rows.forEach((row, i) => {
                    row.forEach((cell, j) => {
                        const xPosition = tableLeft + j * colWidth + textLeftMargin;
                        const yPosition = tableTop + headerHeight + i * rowHeight + textTopMargin;
            
                        doc.text(cell, xPosition, yPosition).rect(tableLeft + j * colWidth, tableTop + headerHeight + i * rowHeight, colWidth, rowHeight).stroke();
                    });
                });




            } else {
                doc.text('No sales data available.');
            }
        }else if (reportType === 'Yearly') {
            const startOfYear = new Date();
            startOfYear.setHours(0, 0, 0, 0);
            startOfYear.setMonth(0, 1); // Set the month to January and day to the first day
        
            const endOfYear = new Date(startOfYear);
            endOfYear.setFullYear(endOfYear.getFullYear() + 1);
            endOfYear.setDate(endOfYear.getDate() - 1);
            endOfYear.setHours(23, 59, 59, 999);
        
            const orderCount = await Order.countDocuments({
                createdAt: {
                    $gte: startOfYear,
                    $lt: endOfYear,
                }
            });
        
            const orderCountDelivered = await Order.countDocuments({
                orderStatus: 'delivered',
                createdAt: {
                    $gte: startOfYear,
                    $lt: endOfYear,
                }
            });
        
            const orderCountCancelled = await Order.countDocuments({
                orderStatus: ['returned', 'cancelled'],
                createdAt: {
                    $gte: startOfYear,
                    $lt: endOfYear,
                }
            });
        
            const totalRevenue = await Order.aggregate([
                {
                    $match: {
                        orderStatus: 'delivered',
                        createdAt: {
                            $gte: startOfYear,
                            $lt: endOfYear,
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$cart.total' }
                    }
                }
            ]);
            console.log(totalRevenue);
        
            if (doc) {
                const table = {
                    headers: ['Titles', 'Results'],
                    rows: [
                        ['Total Revenue', `$${totalRevenue[0].totalRevenue} `],
                        ['Total Orders', `${orderCount}`],
                        ['Total Delivered Order', `${orderCountDelivered}`],
                        ['Total Cancelled And Returned Order', `${orderCountCancelled}`],
                    ],
                };
        
                const tableTop = 120; // Adjust as needed
                const tableLeft = 80; // Adjust as needed
                const rowHeight = 20; // Adjust as needed
                const colWidth = 225; // Adjust as needed
                const headerHeight = 20; // Adjust as needed
                const textTopMargin = 5; // Adjust as needed
                const textLeftMargin = 10; // Adjust as needed
        
                doc.font('Helvetica-Bold');
                doc.fontSize(12);
        
                // Draw headers
                table.headers.forEach((header, i) => {
                    const xPosition = tableLeft + i * colWidth + textLeftMargin;
                    const yPosition = tableTop + textTopMargin;
        
                    doc.text(header, xPosition, yPosition).rect(tableLeft + i * colWidth, tableTop, colWidth, headerHeight).stroke();
                });
        
                // Draw rows
                table.rows.forEach((row, i) => {
                    row.forEach((cell, j) => {
                        const xPosition = tableLeft + j * colWidth + textLeftMargin;
                        const yPosition = tableTop + headerHeight + i * rowHeight + textTopMargin;
        
                        doc.text(cell, xPosition, yPosition).rect(tableLeft + j * colWidth, tableTop + headerHeight + i * rowHeight, colWidth, rowHeight).stroke();
                    });
                });
            } else {
                doc.text('No sales data available.');
            }
        }



        doc.end();

        writeStream.on('finish', function() {
            res.contentType('application/pdf');
            res.download(`report_${reportType}.pdf`, function(err) {
                if (err) {
                    console.log("Error in downloading file.");
                } else {
                    console.log('PDF generated successfully!');
                }
            });
        });
    } catch (error) {
        console.log(error.message);
    }
}





    const generateExcel = async(req,res)=>{
        try {
            
            const reportType = req.query.reportType


            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sales Report');


            worksheet.addRow(['Total Revenue','Total Order', 'Delivered Order',  'Cancelled and Returned Order']);






            
            
        if (reportType === 'Weekly') {

            const startOfWeek = new Date();
            startOfWeek.setHours(0, 0, 0, 0);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

            const endOfWeek = new Date();
            endOfWeek.setHours(23, 59, 59, 999);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

         
                const orderCount = await Order.countDocuments({
                    createdAt: {
                        $gte: startOfWeek,
                        $lt: endOfWeek,
                    }
                });

                const orderCountDelivered = await Order.countDocuments({
                    orderStatus: 'delivered',
                    createdAt: {
                        $gte: startOfWeek,
                        $lt: endOfWeek,
                    }
                });

                const orderCountCancelled = await Order.countDocuments({
                    orderStatus: ['returned','cancelled'],
                    createdAt: {
                        $gte: startOfWeek,
                        $lt: endOfWeek,
                    }
                });

                const totalRevenue = await Order.aggregate([
                    {
                        $match: {
                            orderStatus: 'delivered',
                            createdAt: {
                                $gte: startOfWeek,
                                $lt: endOfWeek,
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: '$cart.total' }
                        }
                    }
                ]);



                
                worksheet.addRow([
                    totalRevenue[0].totalRevenue,
                    orderCount,
                    orderCountDelivered,
                    orderCountCancelled 
                  ]);




        }
        if (reportType === 'Monthly') {







            const startOfMonth = new Date();
            startOfMonth.setHours(0, 0, 0, 0);
            startOfMonth.setDate(1);
        
            const endOfMonth = new Date(startOfMonth);
            endOfMonth.setMonth(endOfMonth.getMonth() + 1);
            endOfMonth.setDate(endOfMonth.getDate() - 1);
            endOfMonth.setHours(23, 59, 59, 999);
        
            const orderCount = await Order.countDocuments({
                createdAt: {
                    $gte: startOfMonth,
                    $lt: endOfMonth,
                }
            });
        
            const orderCountDelivered = await Order.countDocuments({
                orderStatus: 'delivered',
                createdAt: {
                    $gte: startOfMonth,
                    $lt: endOfMonth,
                }
            });
        
            const orderCountCancelled = await Order.countDocuments({
                orderStatus: ['returned', 'cancelled'],
                createdAt: {
                    $gte: startOfMonth,
                    $lt: endOfMonth,
                }
            });
        
            const totalRevenue = await Order.aggregate([
                {
                    $match: {
                        orderStatus: 'delivered',
                        createdAt: {
                            $gte: startOfMonth,
                            $lt: endOfMonth,
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$cart.total' }
                    }
                }
            ]);





            worksheet.addRow([
                totalRevenue[0].totalRevenue,
                orderCount,
                orderCountDelivered,
                orderCountCancelled 
              ]);





        }
        if (reportType === 'Yearly') {

            



            const startOfYear = new Date();
            startOfYear.setHours(0, 0, 0, 0);
            startOfYear.setMonth(0, 1); // Set the month to January and day to the first day
        
            const endOfYear = new Date(startOfYear);
            endOfYear.setFullYear(endOfYear.getFullYear() + 1);
            endOfYear.setDate(endOfYear.getDate() - 1);
            endOfYear.setHours(23, 59, 59, 999);
        
            const orderCount = await Order.countDocuments({
                createdAt: {
                    $gte: startOfYear,
                    $lt: endOfYear,
                }
            });
        
            const orderCountDelivered = await Order.countDocuments({
                orderStatus: 'delivered',
                createdAt: {
                    $gte: startOfYear,
                    $lt: endOfYear,
                }
            });
        
            const orderCountCancelled = await Order.countDocuments({
                orderStatus: ['returned', 'cancelled'],
                createdAt: {
                    $gte: startOfYear,
                    $lt: endOfYear,
                }
            });
        
            const totalRevenue = await Order.aggregate([
                {
                    $match: {
                        orderStatus: 'delivered',
                        createdAt: {
                            $gte: startOfYear,
                            $lt: endOfYear,
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$cart.total' }
                    }
                }
            ]);





            worksheet.addRow([
                totalRevenue[0].totalRevenue,
                orderCount,
                orderCountDelivered,
                orderCountCancelled 
              ]);



        }
           

            // Generate Excel file
            const buffer = await workbook.xlsx.writeBuffer();
           
            const fileName = `${reportType}_sales_report.xlsx`;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            res.send(buffer);
            

        } catch (error) {
            console.log(error.message);
        }
    }











const adminLogout = async(req,res)=>{
    try {
        
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    loadDashboad,
    loadUsers,
    blockUser,
    unblockUser,
    loadLogin,
    insertLogin,
    adminLogout,
    generatePdf,
    generateExcel
}