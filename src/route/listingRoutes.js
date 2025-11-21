import express from 'express';
import { getListing, getListingById,getAllListings } from '../controllers/listingContoller.js';
import { listingsLimiter } from '../middlewares/rateLimiting.js';

const router = new express.Router();

router.get("/products/get-products", listingsLimiter, getListing)
router.get("/products/:listingId", getListingById)
router.get("/products/all",getAllListings)

export default router;