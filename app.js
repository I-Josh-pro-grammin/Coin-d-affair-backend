import 'dotenv/config'
import express from 'express'
import cors from 'cors'
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
import verificationRoutes from './src/route/verificationRoutes.js'
import favoritesRoutes from './src/route/favoritesRoutes.js'
import debugRoutes from './debug_routes.js'
import swaggerSpec from './src/swagger.js'
import pool from './src/config/database.js'
import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'
import { runMigrations } from './src/utils/dbMigrate.js'

const app = express()

/* =======================
   GLOBAL ERROR HANDLERS
======================= */
process.on('uncaughtException', (err) => {
  console.error('CRITICAL: Uncaught Exception:', err)
})

process.on('unhandledRejection', (reason) => {
  console.error('CRITICAL: Unhandled Rejection:', reason)
})

/* =======================
   TRUST PROXY (AWS)
======================= */
app.set('trust proxy', 1)

/* =======================
   CORS CONFIG
======================= */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:4173",
  "http://localhost:5173",
  "http://localhost:8080",
  "https://akaguriroo.com",
  "https://www.akaguriroo.com",
  "https://akaguriroo-backend.onrender.com"
]

if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL)
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)

    const isLocalhost =
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')

    if (allowedOrigins.includes(origin) || isLocalhost) {
      callback(null, true)
    } else {
      console.log('Blocked by CORS:', origin)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}))

/* =======================
   MIDDLEWARES
======================= */
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/* =======================
   STATIC FILES
======================= */
app.use(express.static(path.join(__dirname, 'public')))

/* =======================
   DEBUG & SWAGGER
======================= */
app.get('/api/swagger.json', (req, res) => {
  res.json(swaggerSpec)
})

app.get('/api/_debug', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT 1 AS ok')
    res.json({
      cloudinary: {
        cloud: !!process.env.CLOUDINARY_CLOUD_NAME,
        key: !!process.env.CLOUDINARY_API_KEY,
        secret: !!process.env.CLOUDINARY_API_SECRET
      },
      frontendUrl: process.env.FRONTEND_URL || null,
      db: dbRes.rows[0]
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/* =======================
   ROUTES
======================= */
app.use('/api', listingRoutes)
app.use('/api', authRoutes)
app.use('/api', paymentRoutes)
app.use('/api', orderRoutes)
app.use('/api', businessRoutes)
app.use('/api', cartRoutes)
app.use('/api', categoryRoutes)
app.use('/api', verificationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api', favoritesRoutes)
app.use('/api', debugRoutes)
app.use('/users', userRoutes)

/* =======================
   ERROR HANDLER
======================= */
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error)

  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: error.message })
  }

  res.status(500).json({
    message: "Something went wrong",
    error: process.env.NODE_ENV === "development" ? error.message : undefined
  })
})

/* =======================
   SPA FALLBACK
======================= */
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

/* =======================
   START SERVER (FIXED)
======================= */
const PORT = Number(process.env.PORT) || 10000

const startServer = async () => {
  try {
    console.log("Cloudinary Config:")
    console.log("- CLOUDINARY_CLOUD_NAME:", !!process.env.CLOUDINARY_CLOUD_NAME)
    console.log("- CLOUDINARY_API_KEY:", !!process.env.CLOUDINARY_API_KEY)
    console.log("- CLOUDINARY_API_SECRET:", !!process.env.CLOUDINARY_API_SECRET)

    await runMigrations()

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`)
    })
  } catch (err) {
    console.error("❌ Server failed to start:", err)
    process.exit(1)
  }
}

startServer()

export default app
