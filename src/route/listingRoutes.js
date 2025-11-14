import express from 'express';
import { createListing,getListing } from '../controllers/listingContoller.js';
import { listingsLimiter } from '../middlewares/rateLimiting.js';
import protectedRoutes from '../middlewares/authMiddleware.js';
const router = new express.Router();

router.get("/products/get-products",getListing,listingsLimiter)

export default router;