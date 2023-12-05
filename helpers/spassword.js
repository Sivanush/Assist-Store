const bcrypt = require('bcrypt');


const securePassword = async(password) =>{
    try {
        const hash = await bcrypt.hash(password,10)
        return hash
    } catch (error) {
        console.log(error.message);
    }
}

const checkPassword = async(password,hashPassword)=>{
    try {
        const pass = await bcrypt.compare(password,hashPassword)
        return pass
    } catch (error) {
        console.log(error.message);
    }
}





module.exports = {
    securePassword,
    checkPassword
}