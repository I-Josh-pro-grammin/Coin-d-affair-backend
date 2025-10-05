import express from 'express'
import cors from 'cors'
import bodyParser from "body-parser"
import listingRoutes from './src/route/listingRoutes.js'
import authRoutes from './src/route/authRoutes.js'
import orderRoutes from "./src/route/orderRoutes.js"
import paymentRoutes from './src/route/paymentRoutes.js'
const app = express()

app.use(cors())
app.use(bodyParser.json())

app.use('/',listingRoutes)
app.use('/',authRoutes)
app.use('/',paymentRoutes)
app.use("/",orderRoutes)

export default app;