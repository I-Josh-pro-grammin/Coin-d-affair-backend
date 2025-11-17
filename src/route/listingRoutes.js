import express from 'express';
import { getListing, getListingById } from '../controllers/listingContoller.js';
import { listingsLimiter } from '../middlewares/rateLimiting.js';

const router = new express.Router();

router.get("/products/get-products", listingsLimiter, getListing)
router.get("/products/:listingId", getListingById)

export default router;