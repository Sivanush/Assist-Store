const path = require('path')
const multer = require('multer')

const storage = multer.diskStorage({
    destination:function(req,file,callback) {
        callback(null,'public/uploads/')
    },
    filename:function(req,file,callback) {
        const data = Date.now()+'-'+file.originalname
        callback(null,data)
    }
})

const upload = multer({ storage: storage })


  const multiupload = upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 },
    {name:'hoverImage', maxCount:1 }
  ]);
module.exports = {
    upload,
    multiupload
    

}