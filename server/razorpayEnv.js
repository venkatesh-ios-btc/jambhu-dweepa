/**
 * Clean values copied from Razorpay Dashboard / chat (quotes, newlines, spaces).
 */
export function loadRazorpayCredentials() {
  const keyId = normalizeKey(process.env.RAZORPAY_KEY_ID).replace(/\s/g, '');
  const keySecret = normalizeKey(process.env.RAZORPAY_KEY_SECRET).replace(/\s/g, '');
  return { keyId, keySecret };
}

function normalizeKey(v) {
  if (v == null) return '';
  let s = String(v).replace(/^\uFEFF/, '').trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s.replace(/\r?\n/g, '').trim();
}
