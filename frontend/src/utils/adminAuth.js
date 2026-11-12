export const ADMIN_KEY_STORAGE = 'sfs-admin-key';

export function getStoredAdminKey() {
  try {
    return localStorage.getItem(ADMIN_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function setStoredAdminKey(adminKey) {
  try {
    localStorage.setItem(ADMIN_KEY_STORAGE, String(adminKey || ''));
  } catch {
    // Ignore storage failures in private browsing.
  }
}

export function adminHeaders(adminKey) {
  return {
    'x-admin-key': String(adminKey || '').trim(),
  };
}
