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


  const multiupload = multer({ storage: storage }).fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'image', maxCount: 4 },
    {name:'hoverImage', maxCount:1 }
  ]);
module.exports = {
    upload,
    multiupload
    

}