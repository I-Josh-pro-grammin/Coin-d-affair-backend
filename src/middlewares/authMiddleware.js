import { verifyToken } from '../utils/jwt.js'

function protectedRoutes(accountType){
    const allowedTypes = Array.isArray(accountType) ? accountType : [accountType]
    return (req,res,next) =>{
        const token = req.cookies.Token

        if(!token){
            return res.status(403).json({message: "Forbidden"})
        }

        try {
            const decoded = verifyToken(token)
            if(!allowedTypes.includes(decoded.accountType)){
                return res.status(403).json({message: "Forbidden"})
            }
            req.user =  decoded;
            next()
        } catch (error) {
            res.status(401).json({message: "Invalid token"})
        }
    }
}

export default protectedRoutes;