import express from 'express';
import { getCustomersNumber } from '../controllers/UserController.js';
import protectedRoutes from '../middlewares/authMiddleware.js';

const router = express.Router();

// /**
//  * @swagger
//  * /api/checkout-session:
//  *   post:
//  *     summary: Create Stripe checkout session (logged-in or guest)
//  *     tags: [Payments]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               cartItems:
//  *                 type: array
//  *                 items:
//  *                   type: object
//  *                   properties:
//  *                     listingId:
//  *                       type: string
//  *                     quantity:
//  *                       type: integer
//  *               email:
//  *                 type: string
//  *                 description: Optional email for guest checkout
//  *     responses:
//  *       200:
//  *         description: "Get customer number"
//  *       400:
//  *         description: Invalid cart
//  */

// /**
//  * @swagger
//  * /api/webhook:
//  *   post:
//  *     summary: Stripe webhook for payment events
//  *     tags: [Payments]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *     responses:
//  *       200:
//  *         description: Webhook received
//  */
// router.get('/users', protectedRoutes(), getCustomersNumber);

router.get('/', getCustomersNumber)
// router.get('/', protectedRoutes(), getCustomersNumber)

export default router;