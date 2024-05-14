const generateOtp = require('generate-otp');
const nodemailer = require('nodemailer');
require('dotenv').config();

const generate = () => {
    const otp = generateOtp.generate(4, {
        length: 4,
        digits: true,
        uppercase: false,
        alphabets: false,
        specialChars: false,
    });
    return otp;
}





const sendOtp = (email, otp) => {
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
            subject: 'OTP for your e-commerce website',
            text: 
            `${otp} is your Assist Account verification code.`

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
    generate,
    sendOtp
}