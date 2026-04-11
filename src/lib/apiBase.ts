/**
 * API base URL.
 * - Dev default `/api` → Vite proxy to 127.0.0.1:5050 (avoids direct :5050 fetch/CORS issues).
 * - Set VITE_API_URL if you need an explicit origin (e.g. http://127.0.0.1:5050).
 * - Prod: plain Vercel/static hosting has no Node API — `/api` is usually rewritten to index.html
 *   and scans will fail unless you set VITE_API_URL to your deployed API (https://…) at build time.
 */
export function getApiBase(): string {
  const raw = import.meta.env.VITE_API_URL;
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (trimmed.length > 0) return trimmed.replace(/\/$/, '');
  return '/api';
}
