import express from 'express';
import { createListing,getListing } from '../controllers/listingContoller.js';
import { listingsLimiter } from '../middlewares/rateLimiting.js';
import protectedRoutes from '../middlewares/authMiddleware.js';
import checkSubscription from '../middlewares/subscriptionMiddleware.js';
const router = new express.Router();

// router.post("/products/createProduct",protectedRoutes("business"),checkSubscription,createListing)
router.get("/products/getProducts",getListing,listingsLimiter)

export default router;