import Stripe from "stripe";
import pool from "../config/database.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (req, res) => {
  try {
    const { cartItems } = req.body;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const listingsQuery = await pool.query(
      `SELECT l.listings_id,l.price,l.title,l.business_id,l.currency,b.stripe_account_id from listings l left join businesses b on l.business_id = b.business_id where l.listings_id = ANY($1)`,
      [cartItems.map((i) => i.listingId)]
    );
    const lineItems = [];
    const businessMapping = {};

    for (const listing of listingsQuery.rows) {
      if (!listing.business_id) {
        return res
          .status(400)
          .json({
            message: `Business with this product ${listing.title} is not found`,
          });
      }
    }

    listingsQuery.rows.forEach((listing) => {
      const cartItem = cartItems.find(
        (i) => i.listingId === listing.listings_id
      );

      if(!cartItem) return;
      
      lineItems.push({
        price_data: {
          currency: listing.currency || "usd",
          product_data: { name: listing.title },
          unit_amount: Math.round(listing.price * 100),
        },
        quantity: cartItem.quantity,
      });
      if (!businessMapping[listing.business_id]) {
        businessMapping[listing.business_id] = [];
      }
      businessMapping[listing.business_id].push({
        listing_id: listing.listings_id,
        quantity: cartItem.quantity,
        unit_price: listing.price,
      });
    });

    if (lineItems.length === 0) {
      return res.status(400).json({ message: "Invalid cart items" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      metadata: { businessMapping: JSON.stringify(businessMapping) },
      success_url: `${process.env.FRONTEND_URL}/checkout/success`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export { createCheckoutSession };
