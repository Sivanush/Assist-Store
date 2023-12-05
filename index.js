require('dotenv').config();
const express = require('express')
const app = express()
const path = require('path') 
const morgan = require('morgan')
const session = require('express-session')
const nocache = require('nocache');
const multer = require('multer');
const flash = require('connect-flash');
const crypto = require('crypto')


app.use(flash());

//mongoose
const mongoose = require('mongoose')
mongoose.connect('mongodb+srv://sivanush:sivanush@ecommerce.vor4n5k.mongodb.net/Ecommerse')


app.use(session({
    secret:'secret',
    resave:false,
    saveUninitialized:true
}))


//routes
const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute')


//view engine
app.set('views',path.join(__dirname,'views'))
app.set('view engine','ejs')


//no cache

app.use(nocache());


//morgan
// app.use(morgan('dev'))


//express parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// set static folder
app.use(express.static(path.join(__dirname,'public')))


app.use('/',userRoute)
app.use('/admin',adminRoute)
















app.use('*',(req,res)=>{
    res.render('404error')
 })



const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))