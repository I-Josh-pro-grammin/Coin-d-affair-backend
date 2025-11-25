import express from 'express'
import cors from 'cors'
import bodyParser from "body-parser"
import cookieParser from 'cookie-parser'
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
import path from 'path'
import { fileURLToPath } from 'url'
const app = express()
const allowedOrigin = process.env.FRONTEND_URL || "*"

app.use(cors({
  origin: allowedOrigin,
  credentials: true
}))

app.use(express.json())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())



const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Serve static files from "public"
app.use(express.static(path.join(__dirname, 'public')))
app.get('/api/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})
app.use('/api', listingRoutes)
app.use('/api', authRoutes)
app.use('/api', paymentRoutes)
app.use("/api", orderRoutes)
app.use("/api", businessRoutes)
app.use('/api', cartRoutes)
app.use('/api', categoryRoutes)
app.use('/api', adminRoutes)

export default app;