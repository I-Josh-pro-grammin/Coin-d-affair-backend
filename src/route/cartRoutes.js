import express from 'express';
import {
  createCart,
  addItemToCart,
  getCart,
  getCartItem,
  removeItemFromCart
} from '../controllers/cartController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Cart
 *     description: Shopping cart endpoints
 */

/**
 * @swagger
 * /api/cart/create-cart:
 *   post:
 *     summary: Create a new cart
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *               session_token:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cart created successfully
 *       400:
 *         description: Cart already exists
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/cart/add-item-to-cart:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cart_id:
 *                 type: string
 *               listing_id:
 *                 type: integer
 *               sku_item_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               price_at_add:
 *                 type: number
 *     responses:
 *       201:
 *         description: Item added successfully
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/cart/get-cart/{cart_id}:
 *   get:
 *     summary: Get cart by ID
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: cart_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart details
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/cart/get-cart-item/{cart_item_id}:
 *   get:
 *     summary: Get cart item by ID
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: cart_item_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart item details
 *       404:
 *         description: Cart item not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/cart/remove-item/{cart_item_id}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: cart_item_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart item removed successfully
 *       500:
 *         description: Internal server error
 */

router.post('/cart/create-cart', createCart);
router.post('/cart/add-item-to-cart', addItemToCart);
router.get('/cart/get-cart/:cart_id', getCart);
router.get('/cart/get-cart-item/:cart_item_id', getCartItem);
router.delete('/cart/remove-item/:cart_item', removeItemFromCart);

export default router;