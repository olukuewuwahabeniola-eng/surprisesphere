/**
 * Collapse every gold shade to the single approved #F1D58A.
 */
const fs = require('fs');
const path = require('path');

const GOLD = '#f1d58a';
const GOLD_RGB = '241, 213, 138';
const GOLD_URI = '%23F1D58A';

function unify(text) {
  let out = text;
  out = out.replace(/#d4af37\b/gi, GOLD);
  out = out.replace(/#e4c65a\b/gi, GOLD);
  out = out.replace(/#c9a227\b/gi, GOLD);
  out = out.replace(/#b8860b\b/gi, GOLD);
  out = out.replace(/#daa520\b/gi, GOLD);
  out = out.replace(/rgba\(\s*212\s*,\s*175\s*,\s*55/g, `rgba(${GOLD_RGB}`);
  out = out.replace(/rgb\(\s*212\s*,\s*175\s*,\s*55\s*\)/g, `rgb(${GOLD_RGB})`);
  out = out.replace(/%23[Dd]4[Aa][Ff]37/g, GOLD_URI);
  out = out.replace(/%23[Ee]4[Cc]65[Aa]/g, GOLD_URI);
  return out;
}

const files = [
  'src/styles/global.css',
  'src/components/admin/AdminCharts.jsx',
  'src/pages/AdminDashboardPage.jsx',
  'public/favicon.svg',
];

const root = path.join(__dirname, '..');
for (const rel of files) {
  const full = path.join(root, rel);
  const before = fs.readFileSync(full, 'utf8');
  let after = unify(before);

  if (rel.endsWith('global.css')) {
    // Single gold token system
    after = after.replace(
      /:root \{[\s\S]*?\n\}/,
      `:root {
  /* Official luxury palette — single gold #F1D58A */
  --bg: #0b0b0b;
  --surface: #201d18;
  --gold: #f1d58a;
  --gold-light: #f1d58a;
  --white: #ffffff;
  --soft-white: rgba(255, 255, 255, 0.72);

  /* Primary aliases used across the app */
  --black: #0b0b0b;
  --black-hover: #201d18;
  --cream: #ffffff;
  --cream-deep: #201d18;
  --paper: #201d18;
  --gold-soft: #f1d58a;
  /* Legacy aliases */
  --wine: #0b0b0b;
  --wine-dark: #0b0b0b;
  --terracotta: #f1d58a;
  --ink: #ffffff;
  --muted: rgba(255, 255, 255, 0.64);
  --line: rgba(241, 213, 138, 0.16);
  --line-on-dark: rgba(241, 213, 138, 0.2);
  --shadow: 0 14px 34px rgba(0, 0, 0, 0.45);
  --header: 1120px;
  --font: "Outfit", "Segoe UI", sans-serif;
  --display: "Fraunces", Georgia, serif;
  --script: "Great Vibes", "Segoe Script", cursive;
}`,
    );

    // Announcement bar: soft black + approved gold
    after = after.replace(
      /\.announcement \{\n  background: var\(--black\);\n  color: var\(--gold\);/,
      `.announcement {\n  background: #0b0b0b;\n  color: #f1d58a;`,
    );

    // Product card info → gold
    after = after.replace(
      /\.product-body h3 \{\n  font-size: 0\.86rem;\n  font-weight: 600;\n  line-height: 1\.25;\n  color: var\(--ink\);\n\}/,
      `.product-body h3 {\n  font-size: 0.86rem;\n  font-weight: 600;\n  line-height: 1.25;\n  color: #f1d58a;\n}`,
    );
    after = after.replace(
      /\.product-price \{\n  color: var\(--ink\);\n  font-weight: 700;\n  font-size: 0\.92rem;\n\}/,
      `.product-price {\n  color: #f1d58a;\n  font-weight: 700;\n  font-size: 0.92rem;\n}`,
    );
    after = after.replace(
      /\.product-options select \{\n  width: 100%;\n  min-height: 32px;\n  border: 1px solid var\(--line\);\n  border-radius: 8px;\n  background: #201d18;\n  color: var\(--ink\);/,
      `.product-options select {\n  width: 100%;\n  min-height: 32px;\n  border: 1px solid rgba(241, 213, 138, 0.28);\n  border-radius: 8px;\n  background: #201d18;\n  color: #f1d58a;`,
    );
    after = after.replace(
      /\.product-option-note \{\n  color: var\(--terracotta\);/,
      `.product-option-note {\n  color: #f1d58a;`,
    );
    after = after.replace(
      /\.product-card-rating \{\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  margin: 0;\n  color: var\(--muted\);/,
      `.product-card-rating {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  margin: 0;\n  color: #f1d58a;`,
    );

    // Button hover/focus borders that still hardcode classic gold
    after = after.replace(/border-color:\s*#d4af37/gi, 'border-color: #f1d58a');
    after = after.replace(/outline:\s*2px solid var\(--gold\)/g, 'outline: 2px solid #f1d58a');

    // Admin shell gold tokens
    after = after.replace(/--admin-gold:\s*#[0-9a-fA-F]{6}/g, '--admin-gold: #f1d58a');
    after = after.replace(/--admin-gold-light:\s*#[0-9a-fA-F]{6}/g, '--admin-gold-light: #f1d58a');
    after = after.replace(/--admin-terracotta:\s*#[0-9a-fA-F]{6}/g, '--admin-terracotta: #f1d58a');

    // KPI icon SVGs: green/hidden strokes → approved gold for consistency
    after = after.replace(/%235[fF]8[fF]5[bB]/g, GOLD_URI);
    after = after.replace(/%23171717/g, GOLD_URI);
    after = after.replace(/%230[bB]0[bB]0[bB]/g, GOLD_URI);
  }

  if (after !== before) {
    fs.writeFileSync(full, after);
    console.log('updated', rel);
  } else {
    console.log('unchanged', rel);
  }
}

// Final leftover scan on src + public (ignore scripts)
const leftovers = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.vite' || entry.name === 'scripts') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(css|jsx|js|svg|html)$/i.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      const hits = text.match(/#d4af37|#e4c65a|rgb\(\s*212\s*,\s*175\s*,\s*55|rgba\(\s*212\s*,\s*175\s*,\s*55|%23[Dd]4[Aa][Ff]37/gi);
      if (hits) leftovers.push({ file: path.relative(root, full), count: hits.length, sample: hits.slice(0, 3) });
    }
  }
}
walk(root);
console.log('leftover_old_gold', JSON.stringify(leftovers, null, 2));
