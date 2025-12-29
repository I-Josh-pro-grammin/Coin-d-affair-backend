import Stripe from "stripe";
import pool from "../config/database.js";
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_KEY
    );
  } catch (error) {
    return res.status(400).json({ message: "Webhook error" });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata.orderId
    const businessMapping = JSON.parse(session.metadata.businessMapping);
    for (const [businessId, listings] of Object.entries(businessMapping)) {
      const business = await pool.query(
        `SELECT stripe_account_id from businesses where business_id= $1`,
        [businessId]
      );
      const stripeAccountId = business.rows[0]?.stripe_account_id;
      if (!stripeAccountId) continue;

      //calculating business share
      const totalBusinessAmount = listings.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0
      );
      // we calculating platform fees we take five percent from the total
      const platformFee = totalBusinessAmount * 0.05;

      // amount to be given to the business
      const payoutAmount = totalBusinessAmount - platformFee;

      const transfer = await stripe.transfers.create({
        amount: Math.round(payoutAmount * 100),
        currency: "usd",
        destination: stripeAccountId,
        transfer_group: session.id,
      });

      // save payment transfers for business
      await pool.query(
        `INSERT INTO payments(order_id,provider,provider_payment_id,amount,currency,status,recipient_type,recipient_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
        [orderId, "stripe", transfer.id, payoutAmount, "usd", "succeeded", "business", businessId]
      );

      await pool.query(
        `UPDATE businesses SET total_orders =total_orders+1,total_sales= total_sales + $1 WHERE business_id = $2`,
        [payoutAmount, businessId]
      );
    }
  }

  res.json({ received: true })
};