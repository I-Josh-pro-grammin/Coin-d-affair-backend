import rateLimit from "express-rate-limit";
import fs from "fs"
import path from "path"

function logRateLimit(ip,route){
    const log =`[${new Date().toISOString}] RATE LIMIT: ${ip} on route ${route}`
    fs.appendFileSync(path.join(process.cwd),"Logs","Rate-limiting.log",log)
}

function createRateLimiting({windowMs,max,message,routeName}){
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders:false,
        handler: (req,res)=>{
            const ip = req.ip || req.connection.remoteAddress
            logRateLimit(ip,routeName)

            return res.status(429).json({
                success: false,
                message: message || "Too many requests"
            })
        }
    })

}

const loginLimiter = createRateLimiting({
    windowMs: 15*60*1000,
    max: 5,
    message: "Too many login attempts. Try after 15minutes",
    routeName: "LOGIN"
})

const listingsLimiter = createRateLimiting({
    windowMs: 60*1000,
    max: 100,
    message: "Too many requests",
    routeName: "LISTINGS"
})

const globalLimiter = createRateLimiting({
    windowMs: 60*1000,
    max: 300,
    message: "Too many requests",
    routeName: "GLOBAL"
})

export {loginLimiter,listingsLimiter,globalLimiter}