const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '../src/styles/global.css');
let css = fs.readFileSync(p, 'utf8');

// Accidental background-color: #ffffff from substring replace of "color: #0b0b0b"
css = css.replace(/background-color:\s*#ffffff\s*!important/gi, 'background-color: #0b0b0b !important');
css = css.replace(/background:\s*#ffffff\s*!important/gi, 'background: #0b0b0b !important');

css = css.replace(
  /\.button \{\n  display: inline-flex;[\s\S]*?opacity 0\.2s ease;\n\}/,
  `.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 22px;
  border: 1px solid rgba(241, 213, 138, 0.35);
  border-radius: 999px;
  font-weight: 600;
  letter-spacing: 0.01em;
  background: #0b0b0b;
  color: #f1d58a;
  transition:
    transform 0.22s ease,
    background-color 0.2s ease,
    box-shadow 0.22s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    opacity 0.2s ease;
}`,
);

css = css.replace(
  /\.site-header \{\n  position: relative;\n  background: var\(--black\);\n  border-bottom: 1px solid rgba\(212, 175, 55, 0\.18\);\n\}/,
  `.site-header {
  position: relative;
  background: #201d18;
  border-bottom: 1px solid rgba(212, 175, 55, 0.22);
}`,
);

css = css.replace(
  /\.footer \{\n  margin-top: 8px;\n  background: (?:var\(--black\)|#0b0b0b);\n  color: #ffffff;\n\}/,
  `.footer {
  margin-top: 8px;
  background: #201d18;
  color: #ffffff;
}`,
);

css = css.replace(
  /\.admin-shell \{[\s\S]*?\n\}/,
  `.admin-shell {
  --admin-wine: #ffffff;
  --admin-gold: #d4af37;
  --admin-gold-light: #f1d58a;
  --admin-black: #0b0b0b;
  --admin-cream: #0b0b0b;
  --admin-surface: #201d18;
  --admin-terracotta: #f1d58a;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  background: #0b0b0b;
  color: #ffffff;
}`,
);

css = css.replace(
  /\.admin-unlock h1 \{\n  margin: 0;\n  color: var\(--admin-black\);/,
  '.admin-unlock h1 {\n  margin: 0;\n  color: var(--admin-gold-light);',
);

css = css.replace(
  /\.admin-sidebar \{\n  background: linear-gradient\(180deg, #201d18 0%, #0b0b0b 45%, #0b0b0b 100%\);/,
  '.admin-sidebar {\n  background: linear-gradient(180deg, #141210 0%, #0b0b0b 45%, #050505 100%);',
);

css = css.replace(
  /\.nav-link \{\n  position: relative;\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n  min-height: 26px;\n  color: var\(--gold\);/,
  `.nav-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  min-height: 26px;
  color: var(--gold-light);`,
);

css = css.replace(
  /\.icon-button, \.menu-toggle \{\n  position: relative;\n  border: 0;\n  background: transparent;\n  color: var\(--gold\);/,
  `.icon-button, .menu-toggle {
  position: relative;
  border: 0;
  background: transparent;
  color: var(--gold-light);`,
);

css = css.replace(
  /\.brand p \{\n  margin: -1px 0 0 3px;\n  color: var\(--gold\);/,
  '.brand p {\n  margin: -1px 0 0 3px;\n  color: var(--gold-light);',
);

if (!css.includes('.hero-copy .hero-brand { animation-delay')) {
  css = css.replace(
    '.hero-copy > * {\n  animation: heroCopyIn 0.72s cubic-bezier(0.22, 0.8, 0.28, 1) both;\n}',
    `.hero-copy > * {
  animation: heroCopyIn 0.72s cubic-bezier(0.22, 0.8, 0.28, 1) both;
}

.hero-copy .hero-brand { animation-delay: 0.04s; }
.hero-copy h1 { animation-delay: 0.14s; }
.hero-copy .hero-subtitle { animation-delay: 0.24s; }
.hero-copy .hero-cta { animation-delay: 0.34s; }`,
  );
}

css = css.replace(/\.hero-copy \.hero-brand \{\n  margin: 0;/, '.hero-brand {\n  margin: 0;');

css = css.replace(
  /\.product-card \{\n  display: flex;\n  flex-direction: column;\n  background: #201d18;\n  color: #ffffff;\n  border: 1px solid rgba\(11, 11, 11, 0\.1\);/,
  `.product-card {
  display: flex;
  flex-direction: column;
  background: #201d18;
  color: #ffffff;
  border: 1px solid rgba(241, 213, 138, 0.14);`,
);

css = css.replace(
  /\.product-card:hover \{\n    transform: translateY\(-3px\);\n    border-color: rgba\(11, 11, 11, 0\.18\);\n    box-shadow: 0 12px 24px rgba\(11, 11, 11, 0\.1\);/,
  `.product-card:hover {
    transform: translateY(-3px);
    border-color: rgba(212, 175, 55, 0.35);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.35);`,
);

css = css.replace(
  /background: var\(--cream\);/g,
  'background: #201d18;',
);

css = css.replace(
  /linear-gradient\(90deg, #201d18, #FFFFFF, #201d18\)/gi,
  'linear-gradient(90deg, #201d18, #2a2620, #201d18)',
);

// Mobile site-header already black; ensure open nav charcoal
css = css.replace(
  /\.nav \{\n    display: none;\n    position: absolute;[\s\S]*?background: #[0-9a-f]{6};/i,
  (block) => block.replace(/background: #[0-9a-f]{6};/i, 'background: #201d18;'),
);

// Admin cards/panels still referencing dark text via admin-black for body copy
css = css.replace(/color: var\(--admin-black\)/g, 'color: var(--admin-wine)');

// Soften admin borders that became near-invisible
css = css.replace(/border: 1px solid rgba\(11, 11, 11, 0\.12\)/g, 'border: 1px solid rgba(241, 213, 138, 0.16)');
css = css.replace(/border: 1px solid rgba\(11, 11, 11, 0\.08\)/g, 'border: 1px solid rgba(241, 213, 138, 0.14)');
css = css.replace(/border-bottom: 1px solid rgba\(11, 11, 11, 0\.08\)/g, 'border-bottom: 1px solid rgba(241, 213, 138, 0.12)');

// Inputs in admin / listing
css = css.replace(
  /\.listing-filters \{\n  display: grid;\n  gap: 12px;\n  margin-bottom: 24px;\n  padding: 16px;\n  border: 1px solid var\(--line\);\n  border-radius: 18px;\n  background: var\(--surface\);\n\}/,
  `.listing-filters {
  display: grid;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: #201d18;
  color: #ffffff;
}`,
);

// Drawer surfaces
css = css.replace(
  /\.drawer \{\n  position: absolute;\n  top: 0;\n  right: 0;\n  width: min\(420px, 100%\);\n  height: 100%;\n  background: #201d18;/,
  `.drawer {
  position: absolute;
  top: 0;
  right: 0;
  width: min(420px, 100%);
  height: 100%;
  background: #201d18;`,
);

fs.writeFileSync(p, css);
console.log('fixed bytes', fs.statSync(p).size);

// sanity checks
const badBtn = (css.match(/background-color:\s*#ffffff\s*!important/gi) || []).length;
const adminCream = /--admin-cream:\s*#0b0b0b/.test(css);
const headerOk = /\.site-header \{[\s\S]*?background: #201d18/.test(css);
const footerOk = /\.footer \{[\s\S]*?background: #201d18/.test(css);
console.log({ badBtn, adminCream, headerOk, footerOk });
