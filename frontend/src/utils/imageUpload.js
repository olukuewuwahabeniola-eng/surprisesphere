const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function extensionOf(file) {
  const name = String(file?.name || '').toLowerCase();
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot) : '';
}

export function isAllowedImageFile(file) {
  if (!file) return false;
  const mime = String(file.type || '').toLowerCase();
  if (mime && ALLOWED_MIME.has(mime)) {
    return true;
  }
  // Windows / some cameras leave file.type empty — fall back to extension.
  return ALLOWED_EXT.has(extensionOf(file));
}

export function describeImageRejection(file) {
  if (!file) {
    return 'Choose at least one image file.';
  }
  if (!isAllowedImageFile(file)) {
    const kind = file.type || extensionOf(file) || 'unknown type';
    return `"${file.name || 'File'}" is not supported (${kind}). Use JPG, PNG or WebP.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `"${file.name || 'File'}" is ${mb} MB. Each image must be 5 MB or smaller.`;
  }
  return '';
}

export function validateImageFiles(files = []) {
  const list = Array.from(files || []);
  if (!list.length) {
    return { ok: false, message: 'Choose at least one image file.', files: [] };
  }
  for (const file of list) {
    const message = describeImageRejection(file);
    if (message) {
      return { ok: false, message, files: list };
    }
  }
  return { ok: true, message: '', files: list };
}
