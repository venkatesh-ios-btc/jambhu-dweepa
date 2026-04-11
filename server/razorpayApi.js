/**
 * Razorpay REST API with native fetch (same Basic auth as official curl examples).
 */

const ORDERS_URL = 'https://api.razorpay.com/v1/orders';

function basicAuthHeader(keyId, keySecret) {
  const token = Buffer.from(`${keyId}:${keySecret}`, 'utf8').toString('base64');
  return `Basic ${token}`;
}

export async function razorpayCreateOrder(keyId, keySecret, payload) {
  const res = await fetch(ORDERS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: basicAuthHeader(keyId, keySecret),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const desc =
      data?.error?.description ||
      data?.error?.message ||
      (typeof data?.error === 'string' ? data.error : null) ||
      data?.message ||
      `HTTP ${res.status}`;
    const err = new Error(desc);
    err.statusCode = res.status;
    err.error = data.error ?? data;
    throw err;
  }

  return data;
}

/** GET /v1/orders — minimal authenticated call to verify key_id + key_secret */
export async function razorpayPingAuth(keyId, keySecret) {
  const url = new URL(ORDERS_URL);
  url.searchParams.set('count', '1');
  const res = await fetch(url, {
    headers: { Authorization: basicAuthHeader(keyId, keySecret) },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}
