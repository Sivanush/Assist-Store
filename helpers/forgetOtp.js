const generateOtp = require('generate-otp');
const nodemailer = require('nodemailer');
require('dotenv').config();






const sendOtp = (email, token) => {
    return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            }
        })



        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Forget password for Assist Store',
            text:'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + 'localhost:3000' + '/password/' + token + '\n\n',
            

        }

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error(err)
                reject(err)
            } else {
                
                console.log('Email sent: ' + info.response);
                resolve(info)
            }
        })
    })
}


module.exports = {
    sendOtp
}