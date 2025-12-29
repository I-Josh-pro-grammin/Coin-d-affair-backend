import Stripe from "stripe";
import pool from "../config/database.js";
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      console.error('Stripe not initialized (missing STRIPE_SECRET_KEY)');
      return res.status(500).json({ message: 'Stripe not configured on server' });
    }
    if (!process.env.FRONTEND_URL) {
      console.error('FRONTEND_URL is not set in environment');
      return res.status(500).json({ message: 'FRONTEND_URL not configured on server' });
    }
    const { cartItems, paymentMethod, phone, paymentProvider } = req.body;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const listingsQuery = await pool.query(
      `SELECT l.listings_id,l.price,l.title,l.business_id,l.currency FROM listings l LEFT JOIN businesses b ON l.business_id = b.business_id WHERE l.listings_id = ANY($1)`,
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

      if (!cartItem) return;

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

    // Decide Stripe session options based on requested payment method
    const method = paymentMethod || 'card';

    if (method === 'mobile_money') {
      if (!phone) {
        return res.status(400).json({ message: 'Phone number required for mobile money' });
      }

      // Map known local provider keys to Stripe payment_method_types when possible
      const providerMap = {
        mobilepay: 'mobilepay',
        paynow: 'paynow',
        pix: 'pix',
        promptpay: 'promptpay',
        paynow_zw: 'paynow',
        // MTN/Airtel are not standard Stripe pm types in many regions
        mtn: null,
        airtel: null
      };

      const providerKey = paymentProvider?.toLowerCase();
      const stripePmType = providerMap[providerKey];

      const stripeConfigured = !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_MOBILE_MONEY_ENABLED === 'true';

      // Prefer Stripe mobile-money when Stripe is configured and provider is supported
      if (stripeConfigured && stripePmType) {
        req._stripe_pm_type = stripePmType;
      } else if (process.env.STRIPE_MOBILE_MONEY_SIMULATE === 'true') {
        // Simulation fallback for development
        const fakeSessionId = `sim_${Date.now()}`;
        const fakeUrl = `${process.env.FRONTEND_URL}/mobile-money/simulate?sessionId=${fakeSessionId}&phone=${encodeURIComponent(phone)}`;
        console.info('Returning simulated mobile-money checkout URL (simulation mode)');
        return res.json({ url: fakeUrl, simulated: true });
      } else {
        const supported = ['card', 'acss_debit', 'alipay', 'ideal', 'klarna', 'oxxo', 'p24', 'pix', 'paynow', 'promptpay', 'mobilepay', 'wechat_pay', 'swish'];
        console.error(`Requested payment provider '${paymentProvider}' is not supported by Stripe or Stripe mobile-money not enabled.`);
        return res.status(400).json({
          message: `Requested mobile-money provider '${paymentProvider}' is not supported by Stripe in this configuration. Enable Stripe mobile-money by setting STRIPE_MOBILE_MONEY_ENABLED=true and a supported provider (mobilepay/pix/paynow/etc.), or enable simulation for testing.`
        });
      }
    }

    let session;
    try {
      const sessionParams = {
        payment_method_types: req._stripe_pm_type ? [req._stripe_pm_type] : (method === 'mobile_money' ? ['card'] : ['card']),
        line_items: lineItems,
        mode: 'payment',
        metadata: { businessMapping: JSON.stringify(businessMapping) },
        success_url: `${process.env.FRONTEND_URL}/checkout/success`,
        cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
      };

      // If a mapped Stripe payment method type was set (for mobile-money or other regional methods),
      // attach any method-specific options under that key.
      if (req._stripe_pm_type) {
        sessionParams.payment_method_options = {};
        const pmOptions = {};
        if (phone) pmOptions.phone_number = phone;
        if (paymentProvider) pmOptions.provider = paymentProvider;
        sessionParams.payment_method_options[req._stripe_pm_type] = pmOptions;
      }

      // Log session params (excluding sensitive keys) for debugging
      try {
        console.info('Creating Stripe session with params:', JSON.stringify(sessionParams));
      } catch (logErr) {
        console.info('Creating Stripe session (could not stringify params)');
      }

      session = await stripe.checkout.sessions.create(sessionParams);
    } catch (stripeErr) {
      console.error('Stripe create session error:', stripeErr);
      return res.status(500).json({ message: stripeErr.message || 'Stripe error' });
    }

    res.json({ url: session.url });
  } catch (error) {
    console.error('createCheckoutSession error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { createCheckoutSession };
