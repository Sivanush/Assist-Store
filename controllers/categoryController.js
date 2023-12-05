const Category = require('../models/categoryModal')
const Product = require('../models/productModel')



const loadCategory = async (req, res) => {
    try {
        const cate = await Category.find();
        res.render('admin/category', { cate }); 
    } catch (error) {
        console.log(error.message);
    }
};



const insertCategory = async(req,res)=>{
    
    try {
        const {name,description} = req.body
        const image = req.file 
        const existName = await Category.findOne({name})
        if (existName) {
            const cate = await Category.find();
            // res.render('admin/category',{message:'The category already exist',cate:cate})
            req.flash('message','The category already exist')
            res.redirect('/admin/category')
        } else {
            const categoryData = new Category({
                name,
                description,
                image:`/uploads/${image.filename}`
            })
            await categoryData.save()
            res.redirect('/admin/category');
        }

    } catch (error) {
        console.log(error.message);
    }
}




const listCategory = async(req,res)=>{
    try {
        const id = req.query.id
        
        const userData = await Category.findByIdAndUpdate(id,{
            $set:{
                isListed:true
            }
        })

        await Product.updateMany({category:id},{isPublish:true})

        res.redirect('/admin/category')
    } catch (error) {
        console.log(error.message);
    }
}

const unListCategory = async(req,res)=>{
    try {
        const id = req.query.id
        
        const userData = await Category.findByIdAndUpdate(id,{
            $set:{
                isListed:false
            }
          })  

          await Product.updateMany({category:id},{isPublish:false})


          res.redirect('/admin/category')
    } catch (error) {
        console.log(error.message);
    }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const editCategory = async(req,res)=>{
    try {
        const id = req.params.id;
        const { name, description } = req.body;
        const data = await Category.findById(id)
        if (data) {
            data.name = name
            data.description = description
            if (req.file) {
                 data.image = `/uploads/${req.file.filename}`;
            }
            await data.save()
            res.redirect('/admin/category')
        }else{
            console.log('//////////////////error in the edit category');
        }
    

    } catch (error) {
        console.log(error.message);
    }
}

































module.exports = {
    loadCategory,
    insertCategory,
    listCategory,
    unListCategory,
    editCategory
  
}