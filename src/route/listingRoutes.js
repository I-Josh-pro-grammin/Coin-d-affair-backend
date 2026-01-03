import express from 'express';
import { getListing, getListingById, getAllListings, submitRating } from '../controllers/listingController.js';
import { listingsLimiter } from '../middlewares/rateLimiting.js';
import protectedRoutes from '../middlewares/authMiddleware.js';


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
 *
 * /api/products/{listingId}/rate:
 *   post:
 *     summary: Rate a product
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rating submitted
 *       401:
 *         description: Unauthorized
 */
router.get("/products/get-products", listingsLimiter, getListing)
router.get("/products/:listingId", getListingById)
router.get("/products/all", getAllListings)
router.post("/products/:listingId/rate", protectedRoutes(), submitRating)

export default router;