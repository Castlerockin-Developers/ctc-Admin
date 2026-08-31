const STORAGE_KEY = 'ctc_admin_web_device_id';
const WEB_DEVICE_PREFIX = 'web:admin:';

export function getOrCreateAdminWebDeviceId() {
  if (typeof window === 'undefined') {
    return `${WEB_DEVICE_PREFIX}ssr`;
  }

  try {
    const cached = window.localStorage.getItem(STORAGE_KEY);
    if (cached && cached.startsWith(WEB_DEVICE_PREFIX)) {
      return cached;
    }
  } catch {
    // fall through
  }

  const id = `${WEB_DEVICE_PREFIX}${crypto.randomUUID()}`;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // non-fatal
  }
  return id;
}

export async function parseSessionSuperseded(response) {
  try {
    const body = await response.clone().json();
    if (body?.code === 'session_superseded') {
      return true;
    }
    if (body?.detail && typeof body.detail === 'object' && body.detail.code === 'session_superseded') {
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}
