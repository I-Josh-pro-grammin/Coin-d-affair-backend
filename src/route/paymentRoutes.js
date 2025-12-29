import express from 'express';

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
// Payments have been disabled — platform no longer processes payments.
// Keep routes for backward compatibility but return informative 410 Gone responses.
router.post('/checkout-session', (req, res) => {
	res.status(410).json({ message: 'Payments are disabled. Buyers should contact sellers directly to arrange payment.' });
});
router.post('/webhook', (req, res) => {
	// No webhook handling when payments are disabled
	res.status(410).json({ message: 'Payment webhooks are disabled.' });
});
export default router;