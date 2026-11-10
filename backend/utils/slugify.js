export function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export async function uniqueSlug(Model, base, excludeId) {
  const root = slugify(base) || 'item';
  let candidate = root;
  let counter = 2;

  while (true) {
    const query = { slug: candidate };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    // eslint-disable-next-line no-await-in-loop
    const exists = await Model.exists(query);
    if (!exists) {
      return candidate;
    }
    candidate = `${root}-${counter}`;
    counter += 1;
  }
}
