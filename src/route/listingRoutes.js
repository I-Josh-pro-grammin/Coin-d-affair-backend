import express from 'express';
import { createListing, getListing } from '../controllers/listingContoller.js';
const router = new express.Router();

router.route('/api/listings')
      .post(createListing)
      .get(getListing);

export default router;