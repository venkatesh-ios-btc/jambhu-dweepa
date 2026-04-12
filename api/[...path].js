/**
 * Vercel Node serverless (not Edge): forwards same-origin /api/* to BACKEND_URL/*.
 * Set BACKEND_URL in Vercel → Environment Variables (HTTPS, no trailing slash), then Redeploy.
 */
export default async function handler(req, res) {
  const backend = process.env.BACKEND_URL?.trim().replace(/\/$/, '');
  if (!backend) {
    res.status(503).json({
      error:
        'BACKEND_URL is not set. Vercel → Project → Settings → Environment Variables → add BACKEND_URL (your Node API https origin), then Redeploy.',
    });
    return;
  }

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'localhost';
  const full = new URL(req.url || '/', `${proto}://${host}`);
  const rest = full.pathname.replace(/^\/api/, '') || '/';
  const targetUrl = `${backend}${rest}${full.search}`;

  const skip = new Set([
    'host',
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailers',
    'transfer-encoding',
    'upgrade',
  ]);

  const outHeaders = {};
  for (const key of Object.keys(req.headers)) {
    if (skip.has(key.toLowerCase())) continue;
    const v = req.headers[key];
    if (v !== undefined) outHeaders[key] = v;
  }

  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = chunks.length ? Buffer.concat(chunks) : undefined;
  }

  const r = await fetch(targetUrl, {
    method: req.method,
    headers: outHeaders,
    body,
    redirect: 'manual',
  });

  const buf = Buffer.from(await r.arrayBuffer());
  res.status(r.status);
  r.headers.forEach((value, key) => {
    const low = key.toLowerCase();
    if (low === 'transfer-encoding' || low === 'content-encoding') return;
    res.setHeader(key, value);
  });
  res.send(buf);
}
