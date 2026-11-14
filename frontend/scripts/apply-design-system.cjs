/**
 * One-shot visual design-system pass for Surprise Fashion Sphere.
 * Official palette: #0B0B0B / #201D18 / #D4AF37 / #F1D58A / #FFFFFF
 */
const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../src/styles/global.css');
let css = fs.readFileSync(cssPath, 'utf8');

const ROOT = `:root {
  /* Official luxury palette */
  --bg: #0b0b0b;
  --surface: #201d18;
  --gold: #d4af37;
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
  --terracotta: #d4af37;
  --ink: #ffffff;
  --muted: rgba(255, 255, 255, 0.64);
  --line: rgba(241, 213, 138, 0.16);
  --line-on-dark: rgba(241, 213, 138, 0.2);
  --shadow: 0 14px 34px rgba(0, 0, 0, 0.45);
  --header: 1120px;
  --font: "Outfit", "Segoe UI", sans-serif;
  --display: "Fraunces", Georgia, serif;
  --script: "Great Vibes", "Segoe Script", cursive;
}`;

css = css.replace(/:root\s*\{[\s\S]*?\n\}/, ROOT);

// Text that used brand-black on light surfaces → white on dark surfaces
css = css.replace(/color:\s*var\(--wine\)/g, 'color: var(--ink)');
css = css.replace(/color:\s*var\(--wine-dark\)/g, 'color: var(--ink)');

// Hardcoded legacy colours → official palette
const replacements = [
  [/#171717\b/gi, '#0b0b0b'],
  [/#0f0f0f\b/gi, '#0b0b0b'],
  [/#1a1a1a\b/gi, '#201d18'],
  [/#1f1f1f\b/gi, '#201d18'],
  [/#2a2a2a\b/gi, '#201d18'],
  [/#f7f0e6\b/gi, '#ffffff'],
  [/#efe6d8\b/gi, '#201d18'],
  [/#f7efe6\b/gi, '#201d18'],
  [/#f3e6d8\b/gi, '#201d18'],
  [/#f6ebe0\b/gi, '#201d18'],
  [/#f3e9dd\b/gi, '#201d18'],
  [/#f1e4d5\b/gi, '#201d18'],
  [/#e8d7c4\b/gi, '#201d18'],
  [/#f3e7d8\b/gi, '#201d18'],
  [/#f6e3d4\b/gi, 'rgba(255,255,255,0.72)'],
  [/#e4c65a\b/gi, '#f1d58a'],
  [/#5c5c5c\b/gi, 'rgba(255,255,255,0.64)'],
  [/rgba\(23,\s*23,\s*23/g, 'rgba(11, 11, 11'],
  [/rgba\(44,\s*28,\s*34/g, 'rgba(11, 11, 11'],
  [/rgba\(247,\s*240,\s*230/g, 'rgba(255, 255, 255'],
  [/rgba\(255,\s*253,\s*248/g, 'rgba(255, 255, 255'],
  [/rgba\(243,\s*210,\s*196/g, 'rgba(241, 213, 138'],
];

for (const [from, to] of replacements) {
  css = css.replace(from, to);
}

// White panel fills → charcoal surfaces (keep pure white only for --white token text)
css = css.replace(/background:\s*#FFFFFF\b/gi, 'background: #201d18');
css = css.replace(/background:\s*#fff\b/gi, 'background: #201d18');
css = css.replace(/background-color:\s*#FFFFFF\b/gi, 'background-color: #201d18');
css = css.replace(/background:\s*white\b/gi, 'background: #201d18');
css = css.replace(/background:\s*var\(--paper\)/g, 'background: var(--surface)');

// Body / type defaults
css = css.replace(
  /body\s*\{[\s\S]*?\n\}/,
  `body {
  margin: 0;
  min-width: 320px;
  overflow-x: hidden;
  background: var(--bg);
  color: var(--white);
  font-family: var(--font);
  font-size: 16px;
  line-height: 1.5;
}`,
);

// Buttons: black + light gold + subtle gold border
css = css.replace(
  /\/\* Absolute rule: every button variant = black background \+ gold text \*\/[\s\S]*?\.button-rect \{ border-radius: 8px; \}/,
  `/* Absolute rule: every button = black + light-gold text */
.button,
.button-wine,
.button-primary,
.button-terra,
.button-cream,
.button-secondary,
.button-outline,
.button-publish,
.admin-cat-btn,
.admin-cat-delete,
a.button,
button.button {
  background: #0b0b0b !important;
  color: #f1d58a !important;
  border: 1px solid rgba(241, 213, 138, 0.35) !important;
}

.button:hover,
.button:focus-visible,
.button:active,
.button-wine:hover,
.button-primary:hover,
.button-terra:hover,
.button-cream:hover,
.button-secondary:hover,
.button-outline:hover,
.button-publish:hover,
.admin-cat-btn:hover,
.admin-cat-delete:hover,
a.button:hover,
button.button:hover {
  background: #0b0b0b !important;
  color: #f1d58a !important;
  border-color: #d4af37 !important;
}

.button:disabled,
.button[disabled],
button.button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  background: #0b0b0b !important;
  color: #f1d58a !important;
}

.button svg,
.button i,
a.button svg,
button.button svg {
  color: #f1d58a !important;
  stroke: #f1d58a;
}

.button-block { width: 100%; }
.button-rect { border-radius: 8px; }`,
);

// Core .button base
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

// Header / nav / footer surfaces
css = css.replace(
  /\.site-header \{\n  position: relative;\n  background: var\(--black\);\n  border-bottom: 1px solid rgba\(212, 175, 55, 0\.18\);\n\}/,
  `.site-header {
  position: relative;
  background: #201d18;
  border-bottom: 1px solid rgba(212, 175, 55, 0.22);
}`,
);

css = css.replace(/\.brand p \{\n  margin: -1px 0 0 3px;\n  color: var\(--gold\);/, '.brand p {\n  margin: -1px 0 0 3px;\n  color: var(--gold-light);');
css = css.replace(/\.icon-button, \.menu-toggle \{\n  position: relative;\n  border: 0;\n  background: transparent;\n  color: var\(--gold\);/, '.icon-button, .menu-toggle {\n  position: relative;\n  border: 0;\n  background: transparent;\n  color: var(--gold-light);');
css = css.replace(/\.nav-link \{\n  position: relative;\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n  min-height: 26px;\n  color: var\(--gold\);/, '.nav-link {\n  position: relative;\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n  min-height: 26px;\n  color: var(--gold-light);');
css = css.replace(/\.nav-link::after \{\n  content: "";\n  position: absolute;\n  left: 0;\n  right: 0;\n  bottom: 1px;\n  height: 2px;\n  background: var\(--gold\);/, '.nav-link::after {\n  content: "";\n  position: absolute;\n  left: 0;\n  right: 0;\n  bottom: 1px;\n  height: 2px;\n  background: var(--gold);');
css = css.replace(/\.nav-link svg \{ width: 12px; height: 12px; color: var\(--gold\);/, '.nav-link svg { width: 12px; height: 12px; color: var(--gold-light);');
css = css.replace(/\.nav-link\[aria-current="page"\] \{\n  color: var\(--gold\);\n\}/, '.nav-link[aria-current="page"] {\n  color: var(--gold);\n}');

css = css.replace(
  /\.footer \{\n  margin-top: 8px;\n  background: var\(--black\);\n  color: #ffffff;\n\}/,
  `.footer {
  margin-top: 8px;
  background: #201d18;
  color: #ffffff;
}`,
);

css = css.replace(/\.footer a:hover \{ color: var\(--gold-soft\); \}/, '.footer a:hover { color: var(--gold); }');

// Announcement bar stays near-black with light-gold text
css = css.replace(
  /\.announcement \{\n  background: var\(--black\);\n  color: var\(--gold\);/,
  `.announcement {\n  background: #0b0b0b;\n  color: var(--gold-light);`,
);

// Search / drawers / panels → charcoal
css = css.replace(/background: #201d18;\n  border: 1px solid rgba\(212, 175, 55, 0\.28\);\n  border-radius: 999px;\n  padding: 3px 3px 3px 14px;\n  color: var\(--cream\);/, 'background: #201d18;\n  border: 1px solid rgba(212, 175, 55, 0.28);\n  border-radius: 999px;\n  padding: 3px 3px 3px 14px;\n  color: var(--white);');

// Hero editorial blend + readable light text
css = css.replace(
  /\.hero-veil \{[\s\S]*?\n\}/,
  `.hero-veil {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background:
    linear-gradient(
      105deg,
      rgba(11, 11, 11, 0.88) 0%,
      rgba(11, 11, 11, 0.62) 28%,
      rgba(11, 11, 11, 0.28) 48%,
      rgba(11, 11, 11, 0.08) 64%,
      transparent 78%
    ),
    linear-gradient(
      to top,
      rgba(11, 11, 11, 0.72) 0%,
      rgba(11, 11, 11, 0.2) 34%,
      transparent 58%
    ),
    radial-gradient(ellipse at center, transparent 42%, rgba(11, 11, 11, 0.35) 100%);
}`,
);

css = css.replace(
  /\.hero-stage \{[\s\S]*?\n\}/,
  `.hero-stage {
  position: relative;
  isolation: isolate;
  height: clamp(460px, 62vh, 620px);
  border-radius: 18px;
  overflow: hidden;
  background: #0b0b0b;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.45);
  mask-image: linear-gradient(180deg, #000 86%, transparent 100%);
}`,
);

css = css.replace(
  /\.hero-brand \{[\s\S]*?\n\}/,
  `.hero-brand {
  margin: 0;
  font-family: var(--script);
  font-size: clamp(1.55rem, 2.4vw, 2.05rem);
  font-weight: 400;
  line-height: 1;
  color: var(--gold-light);
  letter-spacing: 0.01em;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.45);
}`,
);

css = css.replace(
  /\.hero-copy h1 \{[\s\S]*?\n\}/,
  `.hero-copy h1 {
  font-family: var(--display);
  font-size: clamp(2.15rem, 3.5vw, 3.15rem);
  font-weight: 650;
  line-height: 1.02;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--white);
  white-space: pre-line;
  max-width: 12ch;
  text-shadow: 0 2px 22px rgba(0, 0, 0, 0.5);
}`,
);

css = css.replace(
  /\.hero-subtitle \{[\s\S]*?\n\}/,
  `.hero-subtitle {
  max-width: 32ch;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--soft-white);
  font-weight: 450;
}`,
);

// Product cards → charcoal + white text
css = css.replace(
  /\.product-card \{\n  display: flex;\n  flex-direction: column;\n  background: #201d18;\n  color: #0b0b0b;/,
  `.product-card {\n  display: flex;\n  flex-direction: column;\n  background: #201d18;\n  color: #ffffff;`,
);
css = css.replace(
  /\.product-card \{\n  display: flex;\n  flex-direction: column;\n  background: #FFFFFF;\n  color: #171717;/i,
  `.product-card {\n  display: flex;\n  flex-direction: column;\n  background: #201d18;\n  color: #ffffff;`,
);

// Category cards already mapped to charcoal via hex replace; ensure text is white
css = css.replace(
  /\.category-card \{[\s\S]*?color: var\(--ink\);/,
  (block) => block.replace('color: var(--ink);', 'color: var(--white);'),
);

// Admin shell tokens + surfaces
css = css.replace(
  /\.admin-shell \{[\s\S]*?color: #0b0b0b;\n\}/,
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
  /\.admin-sidebar \{\n  background: linear-gradient\(180deg, #201d18 0%, #0b0b0b 45%, #0b0b0b 100%\);\n  color: #ffffff;/,
  `.admin-sidebar {\n  background: linear-gradient(180deg, #141210 0%, #0b0b0b 45%, #050505 100%);\n  color: #ffffff;`,
);

css = css.replace(
  /\.admin-nav a \{\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  padding: 10px 12px;\n  border-radius: 999px;\n  color: rgba\(255, 255, 255, 0\.86\);/,
  `.admin-nav a {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  padding: 10px 12px;\n  border-radius: 999px;\n  color: #ffffff;`,
);

css = css.replace(
  /\.admin-nav a:hover,\n\.admin-nav a\.is-active \{\n  background: rgba\(212, 175, 55, 0\.2\);\n  color: #ffffff;\n  box-shadow: inset 3px 0 0 var\(--admin-gold\);\n\}/,
  `.admin-nav a:hover,
.admin-nav a.is-active {
  background: rgba(212, 175, 55, 0.18);
  color: #ffffff;
  box-shadow: inset 3px 0 0 var(--admin-gold);
}

.admin-nav a svg {
  color: var(--admin-gold-light);
  stroke: var(--admin-gold-light);
}`,
);

// Final brand lock → black + light gold
css = css.replace(
  /\/\* ===== Brand lock: black buttons \+ gold text \(final override\) ===== \*\/[\s\S]*$/,
  `/* ===== Brand lock: black buttons + light-gold text (final override) ===== */
.button,
.button-wine,
.button-primary,
.button-terra,
.button-cream,
.button-secondary,
.button-outline,
.button-publish,
.admin-cat-btn,
.admin-cat-delete,
a.button,
button.button,
.hero-cta,
.whatsapp-order,
.newsletter button,
.search > button,
.admin-tab.is-active,
.admin-row-actions .text-button {
  background-color: #0b0b0b !important;
  color: #f1d58a !important;
  border-color: rgba(241, 213, 138, 0.35) !important;
}

.button:hover,
.button:focus-visible,
.button:active,
.button-wine:hover,
.button-primary:hover,
.button-terra:hover,
.button-cream:hover,
.button-secondary:hover,
.button-outline:hover,
.button-publish:hover,
.admin-cat-btn:hover,
.admin-cat-delete:hover,
a.button:hover,
button.button:hover,
.hero-cta:hover,
.whatsapp-order:hover,
.newsletter button:hover,
.search > button:hover,
.admin-row-actions .text-button:hover {
  background-color: #0b0b0b !important;
  color: #f1d58a !important;
  border-color: #d4af37 !important;
}

.button svg,
.button i,
a.button svg,
.hero-cta svg,
.whatsapp-order svg,
.search > button svg,
.newsletter button svg {
  color: #f1d58a !important;
  stroke: #f1d58a;
}
`,
);

// Form inputs on dark UI
css = css.replace(
  /\.contact-form input, \.contact-form textarea \{[\s\S]*?\n\}/,
  `.contact-form input, .contact-form textarea {
  width: 100%;
  border: 1px solid rgba(241, 213, 138, 0.22);
  background: #201d18;
  border-radius: 12px;
  padding: 12px 14px;
  font-weight: 400;
  color: #ffffff;
}

.contact-form input:focus-visible,
.contact-form textarea:focus-visible {
  outline: 2px solid #d4af37;
  outline-offset: 1px;
}`,
);

// Listing filters / review forms already charcoal via #FFFFFF replace; ensure text white
css = css.replace(/color:\s*#0b0b0b/gi, 'color: #ffffff');

// Badge: classic gold on black
css = css.replace(
  /\.badge \{[\s\S]*?background: var\(--gold\);\n  color: var\(--black\);/,
  `.badge {\n  position: absolute;\n  top: -1px;\n  right: 6px;\n  min-width: 16px;\n  height: 16px;\n  padding: 0 4px;\n  border-radius: 999px;\n  background: var(--gold);\n  color: #0b0b0b;`,
);

fs.writeFileSync(cssPath, css);
console.log('Updated', cssPath, 'bytes=', fs.statSync(cssPath).size);