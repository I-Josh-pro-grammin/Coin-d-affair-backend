import express from 'express';
import { getListing, getListingById, getAllListings } from '../controllers/listingController.js';
import { listingsLimiter } from '../middlewares/rateLimiting.js';


const router = new express.Router();
/**
 * @swagger
 * tags:
 *   - name: Listings
 *     description: Listing retrieval endpoints
 *
 * /api/products/get-products:
 *   get:
 *     summary: Get filtered products
 *     tags: [Listings]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: subcategoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of products with pagination
 *
 * /api/products/{listingId}:
 *   get:
 *     summary: Get product details by listingId
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Listing not found
 *
 * /api/products/all:
 *   get:
 *     summary: Get all listings
 *     tags: [Listings]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of all listings with pagination
 */
router.get("/products/get-products", listingsLimiter, getListing)
router.get("/products/:listingId", getListingById)
router.get("/products/all", getAllListings)

export default router;