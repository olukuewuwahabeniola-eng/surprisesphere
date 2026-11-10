const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function readEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!emailPattern.test(email) || email.length > 160) {
    return '';
  }
  return email;
}

export function readText(value, { min = 1, max = 200 } = {}) {
  const text = String(value || '').trim().replace(/\s+/g, ' ');
  if (text.length < min || text.length > max) {
    return '';
  }
  return text;
}
