/**
 * Central API base URL for the admin panel (Vite).
 *
 * Set VITE_API_BASE_URL at build time (e.g. https://api.corp.crackthecampus.com).
 * Django REST routes live under /api (see crackthecampus/urls.py).
 */

const PROD_API_BASE_URL = 'https://api.corp.crackthecampus.com';
const LOCAL_API_BASE_URL = 'http://localhost:8000';

function normalizeApiBaseUrl(url) {
  const trimmed = String(url).trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

function resolveApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return normalizeApiBaseUrl(fromEnv);
  }
  const fallback = import.meta.env.PROD ? PROD_API_BASE_URL : LOCAL_API_BASE_URL;
  return normalizeApiBaseUrl(fallback);
}

/** Django REST API base (includes trailing /api). */
export const apiBaseUrl = resolveApiBaseUrl();

/** Host origin without the trailing /api (for media/static paths). */
export const djangoApiOrigin = apiBaseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
