/**
 * API base URL.
 * - Dev default `/api` → Vite proxy to 127.0.0.1:5050 (avoids direct :5050 fetch/CORS issues).
 * - Set VITE_API_URL if you need an explicit origin (e.g. http://127.0.0.1:5050).
 * - Prod default `/api` → same-origin reverse proxy.
 */
export function getApiBase(): string {
  const raw = import.meta.env.VITE_API_URL;
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (trimmed.length > 0) return trimmed.replace(/\/$/, '');
  return '/api';
}
