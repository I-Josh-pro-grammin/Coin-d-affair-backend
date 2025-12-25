import fetch from 'node-fetch';

async function flutterwaveInitiate({ amount, currency, phone, redirectUrl, metadata, provider }) {
  const base = process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com';
  const secret = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secret) throw new Error('FLUTTERWAVE_SECRET_KEY not set');

  const tx_ref = `tx_${Date.now()}`;
  const body = {
    tx_ref,
    amount: amount.toString(),
    currency: currency || 'USD',
    redirect_url: redirectUrl,
    customer: {
      email: metadata?.email || `guest+${Date.now()}@example.com`,
      phonenumber: phone,
      name: metadata?.name || 'Guest'
    },
    payment_options: 'mobilemoney',
    meta: { provider, ...metadata }
  };

  const res = await fetch(`${base}/v3/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.message || JSON.stringify(data);
    throw new Error(`Flutterwave error: ${msg}`);
  }

  // Try common locations for a redirect/checkout url
  const url = data?.data?.link || data?.data?.authorization?.redirect || data?.data?.authorization_url || data?.data?.payment_link || null;
  if (!url) {
    throw new Error('Flutterwave: no redirect url in response');
  }
  return { url, providerResponse: data };
}

async function paystackInitiate({ amount, currency, phone, redirectUrl, metadata, provider }) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error('PAYSTACK_SECRET_KEY not set');

  const url = 'https://api.paystack.co/transaction/initialize';
  const body = {
    amount: Math.round(amount * 100), // paystack expects kobo/cents
    email: metadata?.email || `guest+${Date.now()}@example.com`,
    callback_url: redirectUrl,
    metadata: { phone, provider, ...metadata }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok || !data.status) {
    const msg = data?.message || JSON.stringify(data);
    throw new Error(`Paystack error: ${msg}`);
  }

  return { url: data.data.authorization_url, providerResponse: data };
}

export async function initiateMobileMoney({ provider, phone, amount, currency, redirectUrl, metadata }) {
  const selected = (process.env.MOBILE_MONEY_PROVIDER || provider || 'flutterwave').toLowerCase();
  if (selected === 'flutterwave') {
    return flutterwaveInitiate({ amount, currency, phone, redirectUrl, metadata, provider });
  }
  if (selected === 'paystack') {
    return paystackInitiate({ amount, currency, phone, redirectUrl, metadata, provider });
  }

  throw new Error(`Unsupported mobile money provider adapter: ${selected}`);
}
