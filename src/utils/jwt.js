import jwt from 'jsonwebtoken';

const generateToken = (user)=> {
    return jwt.sign({ userId: user.user_id,accountType: user.account_type},process.env.JWT_SECRET,{expiresIn: '3h'})
}

const verifyToken = (token)=>{
    return jwt.verify(token,process.env.JWT_SECRET)
}

export {
    generateToken,
    verifyToken
}