/**
 * Vercel Edge proxy: browser calls same-origin `/api/...` (see getApiBase),
 * this forwards to your real Node API so you don't rely only on VITE_API_URL at build time.
 *
 * Vercel → Project → Settings → Environment Variables:
 *   BACKEND_URL = https://your-node-api.example.com   (no trailing slash; same host as /health/db)
 */
export const config = { runtime: 'edge' };

export default async function handler(request) {
  const backend = process.env.BACKEND_URL?.trim().replace(/\/$/, '');
  if (!backend) {
    return new Response(
      JSON.stringify({
        error:
          'BACKEND_URL is not set in Vercel. Add it under Project → Settings → Environment Variables (HTTPS origin of your Node server, no trailing slash), then redeploy.',
      }),
      { status: 503, headers: { 'content-type': 'application/json; charset=utf-8' } },
    );
  }

  const u = new URL(request.url);
  const rest = u.pathname.replace(/^\/api/, '') || '/';
  const targetUrl = `${backend}${rest}${u.search}`;

  const headers = new Headers();
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
  request.headers.forEach((value, key) => {
    if (!skip.has(key.toLowerCase())) headers.append(key, value);
  });

  return fetch(targetUrl, {
    method: request.method,
    headers,
    body:
      request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
  });
}
