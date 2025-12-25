import { verifyToken } from '../utils/jwt.js'

function protectedRoutes(accountType = null) {
    const allowedTypes = accountType
        ? (Array.isArray(accountType) ? accountType : [accountType])
        : null

    return (req, res, next) => {
        const authHeader = req.headers.authorization || ''
        let token = null

        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1]
        } else if (req.cookies && req.cookies.Token) {
            token = req.cookies.Token
        }

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        try {
            const decoded = verifyToken(token)
            // Allow admins to access routes restricted to other roles
            if (allowedTypes && !(allowedTypes.includes(decoded.accountType) || decoded.accountType === 'admin')) {
                console.log('Forbidden: account type not allowed', allowedTypes, decoded.accountType)
                return res.status(403).json({ message: "Forbidden" })
            }
            req.user = decoded;
            req.token = token;
            next()
        } catch (error) {
            res.status(401).json({ message: "Invalid token" })
        }
    }
}

export default protectedRoutes;