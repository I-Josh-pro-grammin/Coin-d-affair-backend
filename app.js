import 'dotenv/config'
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
import favoritesRoutes from './src/route/favoritesRoutes.js'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './src/swagger.js'
import pool from './src/config/database.js'
import path from 'path'
import { fileURLToPath } from 'url'
import upload from './src/config/multer.js'
import multer from 'multer'

const app = express()
const allowedOrigin = [
  process.env.FRONTEND_URL,
  "https://akaguriroo.com",
  "http://localhost:8080"].filter(Boolean)

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

// Add this to the very bottom of your app.js
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;