

const Product = require('../models/productModel')
const Category = require('../models/categoryModal')


const loadProduct = async (req, res) => {
    try {
        const product = await Product.find().populate('category','name')
        const category = await Category.find()


        res.render('admin/product', { product ,category})
    } catch (error) {
        console.log(error.message);
    }
}


const addProduct = async (req, res) => {
    try {
        let { name, description, price ,category ,isComing ,discount} = req.body

        isComing = Boolean(isComing);
    

        const totalStock = {
            
            XS: req.body.totalStockXS,
            S: req.body.totalStockS,
            M: req.body.totalStockM,
            L: req.body.totalStockL,
            XL: req.body.totalStockXL,
            XXL: req.body.totalStockXXL,

        }


        let image = req.files.image.map(file => file.filename)
       let mainImage = req.files.mainImage[0].filename
       let hoverImage = req.files.hoverImage[0].filename

        const foundCategory = await Category.findOne({ name: category });


        const existName = await Product.findOne({ name })
        if (existName) {

            req.flash('message', 'The product already exist')
            return res.redirect('/admin/product')
        } else {
            const newProduct = new Product({
                name,
                description,
                price,
                totalStock,
                isComing,
                image:image,
                mainImage:mainImage,
                hoverImage:hoverImage,
                category:foundCategory._id,
                discount,
                mainPrice:Math.floor(parseInt(req.body.price) - (parseInt(req.body.price) * (parseInt(req.body.discount)/100)))
            })

            await newProduct.save()
            res.redirect('/admin/product')
        }

    } catch (error) {
        console.log(error.message);
    }
}

const blockProduct = async(req,res)=>{
    try {
        const id = req.params.id

        const data = await Product.findByIdAndUpdate(id,{
            $set:{
                isPublish:false
            }
        })
        res.redirect('/admin/product')
    } catch (error) {
        console.log(error.message);
    }
}

const unblockProduct = async(req,res)=>{
    try {
        const id = req.params.id

        const data = await Product.findByIdAndUpdate(id,{
            $set:{
                isPublish:true
            }
        })
        res.redirect('/admin/product')
    } catch (error) {
        console.log(error.message);
    }
}


const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        console.log("ID---"+id);
        let { name, description, price, category,isComing, discount} = req.body;

        isComing = Boolean(isComing);

        console.log(isComing);
        
        const totalStock = {
            XS: req.body.totalStockXS,
            S: req.body.totalStockS,
            M: req.body.totalStockM,
            L: req.body.totalStockL,
            XL: req.body.totalStockXL,
            XXL: req.body.totalStockXXL,
        };

        const existName = await Product.findOne({ name, description, price, category,totalStock });
        if (existName) {
            return res.redirect('/admin');
        } else {
            const updatedProduct = await Product.findByIdAndUpdate(
                id,
                {
                    name,
                    description,
                    price,
                    totalStock,
                    category: category,
                    isComing:isComing,
                    discount,
                    mainPrice:Math.floor(parseInt(req.body.price) - (parseInt(req.body.price) * (parseInt(req.body.discount)/100)))
            },
                { new: true }
            );

            if (req.files && req.files['image']) {
                updatedProduct.image = req.files.image.map(file => file.filename);
            }

            if (req.files && req.files['mainImage']) {
                updatedProduct.mainImage = req.files.mainImage[0].filename;
            }
            if (req.files && req.files['hoverImage']) {
                updatedProduct.hoverImage = req.files.hoverImage[0].filename
            }
            await updatedProduct.save();
            
            res.redirect('/admin/product');
        }
    } catch (error) {
        console.log(error.message);
    }
};


module.exports = {
    addProduct,
    loadProduct,
    blockProduct,
    unblockProduct,
    editProduct
}