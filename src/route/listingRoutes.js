import express from 'express';
import { getListing } from '../controllers/listingContoller.js';
import { listingsLimiter } from '../middlewares/rateLimiting.js';

const router = new express.Router();

router.get("/products/get-products",getListing,listingsLimiter)

export default router;