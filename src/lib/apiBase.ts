/**
 * API base URL.
 * - Dev default `/api` → Vite proxy to 127.0.0.1:5050 (strips `/api` prefix).
 * - Prod on Vercel: same `/api` is handled by `api/[...path].js` Edge proxy → set BACKEND_URL in Vercel
 *   to your Node API origin (HTTPS, no trailing slash), then redeploy — no VITE_API_URL required.
 * - Optional: VITE_API_URL=https://your-api.com at build time to call the API directly (skip proxy).
 */
export function getApiBase(): string {
  const raw = import.meta.env.VITE_API_URL;
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (trimmed.length > 0) return trimmed.replace(/\/$/, '');
  return '/api';
}
