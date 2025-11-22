import express from 'express';
import { createCheckoutSession} from "../controllers/paymentController.js";
import { handleStripeWebhook } from '../controllers/stripeWebhook.js';

const router = express.Router();

/**
 * @swagger
 * /api/checkout-session:
 *   post:
 *     summary: Create Stripe checkout session (logged-in or guest)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cartItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     listingId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *               email:
 *                 type: string
 *                 description: Optional email for guest checkout
 *     responses:
 *       200:
 *         description: Checkout session URL
 *       400:
 *         description: Invalid cart
 */

/**
 * @swagger
 * /api/webhook:
 *   post:
 *     summary: Stripe webhook for payment events
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received
 */
router.post("/checkout-session", createCheckoutSession);
router.post("/webhook", express.raw({ type: 'application/json' }), handleStripeWebhook);
export default router;