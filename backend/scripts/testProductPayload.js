import {
  parseAdminProductQuery,
  sanitizeProductCreateInput,
  sanitizeProductUpdateInput,
} from '../utils/productPayload.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const results = [];

try {
  const created = sanitizeProductCreateInput({
    name: '  Soft Beret  ',
    description: 'Everyday headwear',
    price: '6000',
    category: 'berets',
    images: ['/images/cat-beret.jpg', { url: '/images/prod-classic-beret.jpg', alt: 'Classic' }],
    sizes: ['One Size'],
    colours: [{ label: 'Black', price: 6000 }, 'Cream'],
    variants: [{ size: 'One Size', colour: 'Black', price: 6000, stock: 5 }],
    stock: 5,
    bestSeller: 'true',
    newArrival: false,
    active: true,
  });
  assert(created.name === 'Soft Beret', 'name trim failed');
  assert(created.price === 6000, 'price parse failed');
  assert(created.images.length === 2, 'images normalize failed');
  assert(created.bestSeller === true, 'boolean parse failed');
  assert(created.categoryRef === 'berets', 'category ref failed');
  results.push('PASS create payload sanitization');

  let failed = false;
  try {
    sanitizeProductCreateInput({ name: 'X', price: -1, category: 'bags', images: ['/a.jpg'] });
  } catch (error) {
    failed = error.message.includes('less than');
  }
  assert(failed, 'negative price should fail');
  results.push('PASS reject negative price');

  failed = false;
  try {
    sanitizeProductCreateInput({ name: 'X', price: 10, category: 'bags', images: [] });
  } catch (error) {
    failed = /image/i.test(error.message);
  }
  assert(failed, 'empty images should fail');
  results.push('PASS reject empty images');

  const patch = sanitizeProductUpdateInput({ price: 7000, stock: 2 });
  assert(Object.keys(patch).sort().join(',') === 'price,stock', 'partial patch keys wrong');
  assert(patch.price === 7000 && patch.stock === 2, 'partial values wrong');
  results.push('PASS partial update only includes provided fields');

  failed = false;
  try {
    sanitizeProductUpdateInput({});
  } catch (error) {
    failed = /No product fields/i.test(error.message);
  }
  assert(failed, 'empty update should fail');
  results.push('PASS reject empty update');

  const inactive = parseAdminProductQuery({ status: 'inactive', bestSeller: 'true', sort: 'name' });
  assert(inactive.filters.active === false, 'inactive filter failed');
  assert(inactive.filters.bestSeller === true, 'bestSeller filter failed');
  assert(inactive.sortKey === 'name', 'sort key failed');
  results.push('PASS admin query filters');

  const all = parseAdminProductQuery({});
  assert(all.filters.active === undefined, 'default status should be all (no active filter)');
  results.push('PASS admin list defaults to all statuses');

  console.log('\nProduct payload tests\n');
  results.forEach((line) => console.log(`- ${line}`));
  console.log(`\nAll ${results.length} checks passed.`);
} catch (error) {
  console.error('\nPayload tests failed:\n', error.message || error);
  process.exitCode = 1;
}
