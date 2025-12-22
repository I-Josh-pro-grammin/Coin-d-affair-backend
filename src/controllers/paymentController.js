import Stripe from "stripe";
import pool from "../config/database.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const createCheckoutSession = async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not set in environment');
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

    // Decide Stripe session options based on requested payment method
    const method = paymentMethod || 'card';

    if (method === 'mobile_money') {
      // Ensure mobile money capability configured or simulation enabled
      if (process.env.STRIPE_MOBILE_MONEY_ENABLED !== 'true' && process.env.STRIPE_MOBILE_MONEY_SIMULATE !== 'true') {
        console.error('Mobile money requested but not configured or simulation not enabled');
        return res.status(400).json({ message: 'Mobile money not configured on server' });
      }
      if (!phone) {
        return res.status(400).json({ message: 'Phone number required for mobile money' });
      }

      // If simulation is enabled and real mobile money is not configured, return a fake URL for UI testing
      if (process.env.STRIPE_MOBILE_MONEY_SIMULATE === 'true' && process.env.STRIPE_MOBILE_MONEY_ENABLED !== 'true') {
        const fakeSessionId = `sim_${Date.now()}`;
        const fakeUrl = `${process.env.FRONTEND_URL}/mobile-money/simulate?sessionId=${fakeSessionId}&phone=${encodeURIComponent(phone)}`;
        console.info('Returning simulated mobile-money checkout URL (simulation mode)');
        return res.json({ url: fakeUrl, simulated: true });
      }

      // Map known local provider keys to Stripe payment_method_types when possible
      const providerMap = {
        mobilepay: 'mobilepay',
        paynow: 'paynow',
        pix: 'pix',
        promptpay: 'promptpay',
        paynow_zw: 'paynow',
        mtn: null, // MTN Mobile Money is not a direct Stripe payment_method_type in many regions
        airtel: null
      };

      const stripePmType = providerMap[paymentProvider?.toLowerCase()];
      if (!stripePmType) {
        // List of many Stripe-supported payment_method_types (excerpt)
        const supported = ['card','acss_debit','alipay','ideal','klarna','oxxo','p24','pix','paynow','promptpay','mobilepay','wechat_pay','swish'];
        console.error(`Requested payment provider '${paymentProvider}' is not directly supported as a Stripe payment_method_type.`);
        return res.status(400).json({
          message: `Requested mobile-money provider '${paymentProvider}' is not supported by Stripe in this configuration. Supported payment_method_types include: ${supported.join(', ')}. If you need MTN/Airtel Mobile Money, enable a specific provider integration or use simulation.`
        });
      }
      // store the mapped Stripe payment method type for session construction
      req._stripe_pm_type = stripePmType;
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
