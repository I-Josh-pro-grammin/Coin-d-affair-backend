import express from 'express'
import cors from 'cors'
import bodyParser from "body-parser"
import listingRoutes from './src/route/listingRoutes.js'
import authRoutes from './src/route/authRoutes.js'
import orderRoutes from "./src/route/orderRoutes.js"
import paymentRoutes from './src/route/paymentRoutes.js'
import cartRoutes from './src/route/cartRoutes.js'
import categoryRoutes from './src/route/categoryRoutes.js'
import businessRoutes from './src/route/businessRoutes.js'
import adminRoutes from './src/route/adminRoutes.js'
const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use('/',listingRoutes)
app.use('/',authRoutes)
app.use('/',paymentRoutes)
app.use("/",orderRoutes)
app.use("/api/business", businessRoutes)
app.use('/api/carts/', cartRoutes)
app.use('/api/categories/', categoryRoutes)
app.use('/api/admin', adminRoutes)

export default app;