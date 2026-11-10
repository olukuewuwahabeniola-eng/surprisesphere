export function formatNaira(value) {
  return `₦${Number(value).toLocaleString('en-NG')}`;
}
