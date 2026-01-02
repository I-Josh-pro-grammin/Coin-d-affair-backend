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
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './src/swagger.js'
import pool from './src/config/database.js'
import path from 'path'
import { fileURLToPath } from 'url'
import upload from './src/config/multer.js'
import multer from 'multer'

const app = express()

// Global Crash Handlers
process.on('uncaughtException', (err) => {
  console.error('CRITICAL: Uncaught Exception:', err);
  // Keep the process alive for a moment to flush logs if possible, but usually best to exit.
  // We'll log it and let it crash, hoping Render captures stderr.
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

// Trust proxy is required for Render (and other proxies) to correctly handle IP addresses and rate limiting
app.set('trust proxy', 1);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:4173",
  "http://localhost:5173",
  "http://localhost:8080",
  "https://akaguriroo.com",
  "https://www.akaguriroo.com",
  "https://akaguriroo-backend.onrender.com"
];

// Add FRONTEND_URL from env if it exists and isn't already in the list
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.lovable.app') || isLocalhost) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())



const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Serve static files from "public"
app.use(express.static(path.join(__dirname, 'public')))
app.get('/api/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// Debug endpoint to inspect critical runtime config and DB connectivity
app.get('/api/_debug', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT 1 as ok');
    res.json({
      stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
      frontendUrl: process.env.FRONTEND_URL || null,
      stripeMobileMoneyEnabled: process.env.STRIPE_MOBILE_MONEY_ENABLED || null,
      stripeMobileMoneySimulate: process.env.STRIPE_MOBILE_MONEY_SIMULATE || null,
      db: dbRes.rows[0]
    });
  } catch (err) {
    console.error('Debug endpoint DB error:', err);
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/_debug/listings', async (req, res) => {
  try {
    const results = await pool.query('SELECT listings_id, title, price, currency, business_id FROM listings LIMIT 5');
    res.json({ listings: results.rows });
  } catch (err) {
    console.error('Debug listings error:', err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/_debug/checkout', async (req, res) => {
  try {
    const { cartItems } = req.body;
    if (!Array.isArray(cartItems)) return res.status(400).json({ message: 'cartItems required' });
    const ids = cartItems.map((i) => i.listingId);
    const listingsQuery = await pool.query(
      `SELECT l.listings_id,l.price,l.title,l.business_id,l.currency FROM listings l LEFT JOIN businesses b ON l.business_id = b.business_id WHERE l.listings_id = ANY($1)`,
      [ids]
    );

    const lineItems = [];
    const businessMapping = {};
    for (const listing of listingsQuery.rows) {
      const cartItem = cartItems.find((i) => i.listingId === listing.listings_id);
      if (!cartItem) continue;
      lineItems.push({
        currency: listing.currency || 'usd',
        unit_amount: Math.round(Number(listing.price) * 100),
        quantity: cartItem.quantity,
        title: listing.title,
      });
      if (!businessMapping[listing.business_id]) businessMapping[listing.business_id] = [];
      businessMapping[listing.business_id].push({ listing_id: listing.listings_id, quantity: cartItem.quantity, unit_price: listing.price });
    }

    res.json({ listingsCount: listingsQuery.rowCount, listings: listingsQuery.rows, lineItems, businessMapping });
  } catch (err) {
    console.error('Debug checkout error:', err);
    res.status(500).json({ message: err.message });
  }
});

app.use('/api', listingRoutes)
app.use('/api', authRoutes)
app.use('/api', paymentRoutes)
app.use("/api", orderRoutes)
app.use("/api", businessRoutes)
app.use('/api', cartRoutes)
app.use('/api', categoryRoutes)
app.use('/api', verificationRoutes)
// Mount admin routes under /api/admin so admin-only middleware doesn't run for all /api routes
app.use('/api/admin', adminRoutes)
app.use('/api', favoritesRoutes)
app.use('/users', userRoutes)

// Global error handling middleware (MUST be after all routes)
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);

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

// Serve static files (SPA Support)
import { runMigrations } from './src/utils/dbMigrate.js';
import process from 'process';

// Serve static files (SPA Support)
// Serve static files (SPA Support)
app.get(/(.*)/, (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Check if app.js is the entry point (Render runs 'node app.js')
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const startServer = async (port) => {
    try {
      console.log("Cloudinary Config Check (app.js):");
      console.log(`- CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Present' : 'MISSING'}`);
      console.log(`- CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? 'Present' : 'MISSING'}`);
      console.log(`- CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? 'Present' : 'MISSING'}`);

      await runMigrations();
      const server = app.listen(port, '0.0.0.0', () => {
        console.log(`Server started from app.js on port ${port}`);
      });

      server.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
          console.log(`Port ${port} is in use, trying ${port + 1}...`);
          startServer(port + 1);
        } else {
          console.error("Server error:", e);
        }
      });
    } catch (error) {
      console.error("Failed to start server from app.js:", error);
    }
  };

  const PORT = parseInt(process.env.PORT || 10000);
  startServer(PORT);
}

console.log("ENV LOADED?", {
  cloud: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY,
  secret: process.env.CLOUDINARY_API_SECRET ? "present" : "missing"
});


export default app;