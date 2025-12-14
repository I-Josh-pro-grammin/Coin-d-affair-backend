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
import userRoutes from './src/route/userRoutes.js'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './src/swagger.js'
import path from 'path'
import { fileURLToPath } from 'url'
import upload from './src/config/multer.js'
import multer from 'multer'

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
app.use('/users', userRoutes)

// Global error handling middleware (MUST be after all routes)
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);

  // Multer errors
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: "File too large" });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: "Too many files" });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: "Unexpected field" });
    }
  }

  // Always return JSON, never HTML
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? error.message : undefined
  });
});

export default app;