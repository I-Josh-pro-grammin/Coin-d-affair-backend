const jwt = require('jsonwebtoken')

const generateToken = (user)=> {
    return jwt.sign({ user_id: user.user_id,accountType: user.account_type},process.env.JWT_SECRET,{expiresIn: '3h'})
}

const verifyToken = (token)=>{
    return jwt.verify(token,process.env.JWT_SECRET)
}

module.exports={
    generateToken,
    verifyToken
}