import express from 'express';
import { createListing,getListing } from '../controllers/listingContoller';
import { listingsLimiter } from '../middlewares/rateLimiting';
import protectedRoutes from '../middlewares/authMiddleware';
import checkSubscription from '../middlewares/subscriptionMiddleware';
const router = new express.Router();

// router.post("/products/createProduct",protectedRoutes("business"),checkSubscription,createListing)
router.get("/products/getProducts",getListing,listingsLimiter)

export default router;