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
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './src/swagger.js'
const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use('/api/api-docs',swaggerUi.serve,swaggerUi.setup(swaggerSpec))
app.use('/api',listingRoutes)
app.use('/api',authRoutes)
app.use('/api',paymentRoutes)
app.use("/api",orderRoutes)
app.use("/api", businessRoutes)
app.use('/api', cartRoutes)
app.use('/api', categoryRoutes)
app.use('/api/admin', adminRoutes)

export default app;