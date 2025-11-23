import express from "express";
import checkSubscription from "../middlewares/subscriptionMiddleware.js";
import protectedRoutes from "../middlewares/authMiddleware.js";
import {
  createBusiness,
  getBusinessProductsPost,
  addProductPost,
  updateProductPost,
  deleteProductPost,
  updateBusiness,
  getBusinessOrders,
  getBusinessTransactions,
} from "../controllers/businessController.js";
import upload from "../middlewares/uploadMedia.js";
import { getBusinessProfile } from "../controllers/AdminController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Business
 *     description: Business account and product management
 */




/* ============================================================================
   CREATE BUSINESS
============================================================================ */
/**
 * @swagger
 * /api/business/create-business:
 *   post:
 *     summary: Create a new business account
 *     tags: [Business]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 example: "c049cbd1-ff12-4b79-9c61-a22b23f2d381"
 *               business_name:
 *                 type: string
 *                 example: "Tech Market LLC"
 *               vat_number:
 *                 type: string
 *                 example: "VAT-2024-8899"
 *               subscription_plan:
 *                 type: string
 *                 example: "premium"
 *               is_paid:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Business created successfully
 *       500:
 *         description: Failed to create business
 */





/* ============================================================================
   UPDATE BUSINESS
============================================================================ */
/**
 * @swagger
 * /api/business:
 *   patch:
 *     summary: Update business details
 *     tags: [Business]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 example: "c049cbd1-ff12-4b79-9c61-a22b23f2d381"
 *               business_name:
 *                 type: string
 *                 example: "New Tech Market"
 *               vat_number:
 *                 type: string
 *                 example: "VAT-3030-4455"
 *               subscription_plan:
 *                 type: string
 *                 example: "enterprise"
 *               is_paid:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Business updated
 *       400:
 *         description: No fields provided
 *       500:
 *         description: Failed to update business
 */





/* ============================================================================
   ADD PRODUCT
============================================================================ */
/**
 * @swagger
 * /api/business/add-product:
 *   post:
 *     summary: Add a product listing
 *     tags: [Business]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 example: 1
 *               subcategoryId:
 *                 type: integer
 *                 example: 3
 *               title:
 *                 type: string
 *                 example: "Samsung Galaxy S23 Ultra"
 *               description:
 *                 type: string
 *                 example: "Brand new, sealed box"
 *               price:
 *                 type: number
 *                 example: 1299.99
 *               currency:
 *                 type: string
 *                 example: "USD"
 *               condition:
 *                 type: string
 *                 example: "new"
 *               isNegotiable:
 *                 type: boolean
 *                 example: false
 *               canDeliver:
 *                 type: boolean
 *                 example: true
 *               stock:
 *                 type: integer
 *                 example: 5
 *               attributes:
 *                 type: string
 *                 example: '{"color":"Black","storage":"512GB"}'
 *               locationId:
 *                 type: integer
 *                 example: 12
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Product added successfully
 *       400:
 *         description: Missing image or invalid data
 *       500:
 *         description: Server error
 */





/* ============================================================================
   UPDATE PRODUCT
============================================================================ */
/**
 * @swagger
 * /api/business/update-product/{productId}:
 *   post:
 *     summary: Update an existing product
 *     tags: [Business]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 42
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Samsung Galaxy S23 Ultra"
 *               price:
 *                 type: number
 *                 example: 1199.99
 *               stock:
 *                 type: integer
 *                 example: 10
 *               attributes:
 *                 type: string
 *                 example: '{"color":"Black","warranty":"2 years"}'
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Product updated
 *       403:
 *         description: Not product owner
 *       400:
 *         description: Product has active orders
 *       500:
 *         description: Server error
 */





/* ============================================================================
   DELETE PRODUCT
============================================================================ */
/**
 * @swagger
 * /api/business/delete-product/{productId}:
 *   delete:
 *     summary: Delete a product listing
 *     tags: [Business]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 42
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       400:
 *         description: Cannot delete — product is in active orders
 *       404:
 *         description: Product does not belong to the business
 *       500:
 *         description: Server error
 */





/* ============================================================================
   GET BUSINESS PROFILE  (READ-ONLY FROM ADMIN)
============================================================================ */
/**
 * @swagger
 * /api/business/business-profile:
 *   get:
 *     summary: Get the business profile
 *     tags: [Business]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Business profile data
 *       404:
 *         description: Business not found
 */





/* ============================================================================
   GET BUSINESS PRODUCTS
============================================================================ */
/**
 * @swagger
 * /business/business-products-post:
 *   get:
 *     summary: Get all products posted by this business
 *     tags: [Business]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of business products
 */





/* ============================================================================
   GET BUSINESS TRANSACTIONS
============================================================================ */
/**
 * @swagger
 * /business/transactions:
 *   get:
 *     summary: Get list of business transactions
 *     tags: [Business]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions
 */





/* ============================================================================
   GET BUSINESS ORDERS
============================================================================ */
/**
 * @swagger
 * /business/business-orders:
 *   get:
 *     summary: Get orders assigned to this business
 *     tags: [Business]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders for the business
 */



router.post("/business/create-business", createBusiness);
router.patch("/business/update-profile", protectedRoutes("business"), updateBusiness);
router.post("/business/add-product", upload.array("media", 5), protectedRoutes("business"),checkSubscription, addProductPost);
router.post("/business/update-product/:productId",protectedRoutes("business"), upload.array("media", 5), updateProductPost);
router.delete("/business/delete-product/:productId", protectedRoutes("business"),deleteProductPost);
router.get("/business/business-profile",protectedRoutes("business"), getBusinessProfile);
router.get("/business/business-products-post",protectedRoutes("business"), getBusinessProductsPost);
router.get("/business/transactions", protectedRoutes("business"), getBusinessTransactions);
router.get("/business/business-orders",protectedRoutes("business"), getBusinessOrders);

export default router;