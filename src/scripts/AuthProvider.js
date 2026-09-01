import { error as logError } from '../utils/logger';
import cacheService from '../utils/cacheService';
import {
  getOrCreateAdminWebDeviceId,
  parseSessionSuperseded,
} from './web-device-id';

/** Django mounts REST routes under /api/ (see crackthecampus/urls.py). */
export const baseUrl = 'http://localhost:8000/api';
export const staticUrl = '';
export const SESSION_EXPIRED_MESSAGE = 'Failed to refresh access token';
export const ACCESS_DENIED_MESSAGE = 'You do not have access to the admin panel.';
export const SESSION_SUPERSEDED_MESSAGE =
  'Another device has logged in with the same credentials.';
export const CONCURRENT_SESSION_MESSAGE =
  'This account is active on another device.';

let refreshInFlight = null;

async function performTokenRefresh() {
  const refreshToken = localStorage.getItem('refresh');
  if (!refreshToken) {
    throw new Error('no_refresh_token');
  }

  const refreshResponse = await fetch(baseUrl + '/auth/token/refresh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!refreshResponse.ok) {
    if (await parseSessionSuperseded(refreshResponse)) {
      clearSession();
      throw new Error(SESSION_SUPERSEDED_MESSAGE);
    }
    clearSession();
    throw new Error(SESSION_EXPIRED_MESSAGE);
  }

  const data = await refreshResponse.json();
  localStorage.setItem('access', data.access);
  if (data.refresh) {
    localStorage.setItem('refresh', data.refresh);
  }
  return data.access;
}

function refreshAccessTokenShared() {
  if (!refreshInFlight) {
    refreshInFlight = performTokenRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

const PLAN_CACHE_KEY = 'subscription_plan_cache';
const PLAN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const SETTINGS_CACHE_KEY = 'admin_settings_cache';
const SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function clearSession() {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  localStorage.removeItem('userdata');
  localStorage.removeItem('panelScope');
  // Clear cached dashboard/student/exam/result data to prevent showing previous user's data after re-login
  cacheService.clearAll();
  invalidatePlanCache();
  invalidateSettingsCache();
}

/** Get cached plan/subscription details if present and not expired. Returns null otherwise. */
export function getCachedPlanDetails() {
  try {
    const raw = localStorage.getItem(PLAN_CACHE_KEY);
    if (!raw) return null;
    const { data, fetchedAt } = JSON.parse(raw);
    if (!data || typeof fetchedAt !== 'number') return null;
    if (Date.now() - fetchedAt > PLAN_CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

/** Store plan/subscription details in cache. */
export function setCachedPlanDetails(data) {
  try {
    localStorage.setItem(
      PLAN_CACHE_KEY,
      JSON.stringify({ data, fetchedAt: Date.now() })
    );
  } catch (e) {
    logError('Failed to cache plan details:', e);
  }
}

/** Clear plan cache (e.g. after renewal or logout). */
export function invalidatePlanCache() {
  localStorage.removeItem(PLAN_CACHE_KEY);
}

/** Get cached settings page data if present and not expired. Returns null otherwise. */
export function getCachedSettingsDetails() {
  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (!raw) return null;
    const { data, fetchedAt } = JSON.parse(raw);
    if (!data || typeof fetchedAt !== 'number') return null;
    if (Date.now() - fetchedAt > SETTINGS_CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

/** Store settings page data in cache. */
export function setCachedSettingsDetails(data) {
  try {
    localStorage.setItem(
      SETTINGS_CACHE_KEY,
      JSON.stringify({ data, fetchedAt: Date.now() })
    );
  } catch (e) {
    logError('Failed to cache settings details:', e);
  }
}

/** Clear settings cache (e.g. after profile/org changes or logout). */
export function invalidateSettingsCache() {
  localStorage.removeItem(SETTINGS_CACHE_KEY);
}

export async function authFetch(url, options) {
  let accessToken = localStorage.getItem('access'); // Declare `let` to allow reassignment
  const refreshToken = localStorage.getItem('refresh');

  const { body, method, headers = {} } = options;

  // Check if body is FormData
  const isFormData = body instanceof FormData;
  
  const requestOptions = {
    method: method,
    headers: {
      Authorization: 'Bearer ' + accessToken,
      ...headers, // Merge any additional headers
    },
    body: body, // Don't JSON.stringify here, let the caller handle it
  };

  // Only set Content-Type for JSON, let browser set it for FormData
  if (!isFormData) {
    requestOptions.headers['Content-Type'] = 'application/json';
  }

  // Fetch request
  let response = await fetch(baseUrl + url, requestOptions);

  if (response.status === 401) {
    if (!refreshToken) {
      clearSession();
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }
    try {
      accessToken = await refreshAccessTokenShared();
      requestOptions.headers.Authorization = 'Bearer ' + accessToken;
      response = await fetch(baseUrl + url, requestOptions);
    } catch (err) {
      throw err;
    }
  }

  if (!response.ok) {
    if (response.status === 403) {
      let message = ACCESS_DENIED_MESSAGE;
      try {
        const body = await response.json();
        message = body.detail || body.error || body.message || message;
      } catch (_) {}
      const err = new Error(message);
      err.status = 403;
      throw err;
    }
    // For non-403 errors, try to surface a useful backend message
    let message = 'Network response was not ok';
    try {
      const body = await response.json();
      message = body.error || body.detail || body.message || message;
    } catch (_) {
      // Ignore JSON parsing errors and fall back to the default message
    }
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  return response;
}

export const FixImageRoute = (imageUrl) => {
  return staticUrl + imageUrl;
};

export async function login(username, password, options = {}) {
  const { forceTakeover = true } = options;
  // Use /auth/token/ so for_admin is enforced server-side and tokens include
  // session_version (dj_rest_auth /auth/login/ skips both).
  const payload = {
    email: username,
    password: password,
    for_admin: true,
    force_takeover: Boolean(forceTakeover),
    device_id: getOrCreateAdminWebDeviceId(),
    device_name: 'Admin Web Browser',
  };
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(baseUrl + '/auth/token/', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let message = 'Login failed';
      let code = null;
      try {
        const error = await response.json();
        const nested =
          error?.detail && typeof error.detail === 'object' ? error.detail : error;
        code = nested.code || error.code || null;
        if (code === 'concurrent_session') {
          message =
            (typeof nested.detail === 'string' && nested.detail) ||
            (typeof error.detail === 'string' && error.detail) ||
            CONCURRENT_SESSION_MESSAGE;
        } else {
          message =
            (typeof nested.detail === 'string' && nested.detail) ||
            (typeof error.detail === 'string' && error.detail) ||
            error.message ||
            (Array.isArray(error.non_field_errors) && error.non_field_errors[0]) ||
            message;
        }
      } catch (_) {
        // keep default
      }
      const err = new Error(message);
      err.code = code;
      err.status = response.status;
      throw err;
    }

    const data = await response.json();

    // Store tokens and user details in localStorage
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    localStorage.setItem('userdata', JSON.stringify(data.user));

    return data; // Return the response for further handling
  } catch (error) {
    logError('Login failed:', error);
    throw error;
  }
}

export function logout() {
  clearSession();
}

export function useAuth() {
  const refreshToken = localStorage.getItem('refresh');
  return [!!refreshToken];
}

export async function authFetchPayload(path, payload, method) {
  const body =
    payload instanceof FormData ? payload : JSON.stringify(payload);
  return authFetch(path, { method, body });
}
