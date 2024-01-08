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
        const {name,description,discount} = req.body
        const image = req.file 
        const existName = await Category.findOne({name})
        if (existName) {
          
         
            req.flash('message','The category already exist')
            res.redirect('/admin/category')
        } else {
            const categoryData = new Category({
                name,
                description,
                discount,
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
        const { name, description, discount} = req.body;
        const data = await Category.findById(id)
        if (data) {
            data.discount = discount
            data.name = name
            data.description = description
            if (req.file) {
                 data.image = `/uploads/${req.file.filename}`;
            }

            

           

        await Product.updateMany(
            { category: id },
            [
              {
                $set: {categoryDiscount: data.discount},
              },
            ]
          );
        const productData = await Product.find({ category: id })
            
         
          productData.forEach(async (product) => {
            console.log(product.mainPrice, product.categoryDiscount);
            product.mainPrice = product.price - product.discount
            product.mainPrice = product.mainPrice - product.categoryDiscount;
            await product.save()
        });


     

          
         

            await data.save()
            res.redirect('/admin/category')
        }else{
            console.log('//////////////////error in the edit category');
        }
    

    } catch (error) {
        console.log(error.message);
    }
}





const categoryDiscount = async()=>{

}




























module.exports = {
    loadCategory,
    insertCategory,
    listCategory,
    unListCategory,
    editCategory
  
}