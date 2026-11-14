const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'src', 'styles', 'global.css');
let css = fs.readFileSync(cssPath, 'utf8');
const before = css;

const reps = [
  [/rgba\(118,\s*45,\s*70,/g, 'rgba(23, 23, 23,'],
  [/rgba\(92,\s*34,\s*54,/g, 'rgba(23, 23, 23,'],
  [/rgba\(40,\s*18,\s*28,/g, 'rgba(23, 23, 23,'],
  [/rgba\(201,\s*130,\s*97,/g, 'rgba(176, 141, 59,'],
  [/#762[Dd]46/g, '#B08D3B'],
  [/#5[Cc]2236/g, '#8F732F'],
  [/#6[Aa]2740/g, '#1f1f1f'],
  [/#5[Dd]2238/g, '#121212'],
  [/#c98261/gi, '#B08D3B'],
  [/#8[Aa]4[Ee]2[Ff]/g, '#8F732F'],
  [/#3[Aa]2430/g, '#171717'],
  [/#4[Dd]3[Bb]41/g, '#2a2a2a'],
  [/#8[Aa]6[Bb]75/g, '#5c5c5c'],
  [/#fffdf8/gi, '#FFFFFF'],
  [/#f1e2cf/gi, '#EFE6D8'],
];

for (const [re, to] of reps) {
  css = css.replace(re, to);
}

css = css.replace(
  /\.admin-shell \{\n  --admin-wine: #[0-9a-fA-F]+;\n  --admin-cream: #[0-9a-fA-F]+;\n  --admin-terracotta: #[0-9a-fA-F]+;/,
  `.admin-shell {
  --admin-wine: #B08D3B;
  --admin-gold: #B08D3B;
  --admin-black: #171717;
  --admin-cream: #F7F0E6;
  --admin-terracotta: #B08D3B;`,
);

// Sidebar: wine gradient → soft black with gold accents
css = css.replace(
  /\.admin-sidebar \{\n  background: linear-gradient\([^)]+\);\n  color: #[0-9a-fA-F]+;/,
  `.admin-sidebar {
  background: linear-gradient(180deg, #1f1f1f 0%, #171717 45%, #0f0f0f 100%);
  color: #F7F0E6;`,
);

fs.writeFileSync(cssPath, css);

const leftoverWine = (css.match(/#762[Dd]46/g) || []).length;
const leftoverRgba = (css.match(/rgba\(118,\s*45,\s*70/g) || []).length;
const leftoverTerra = (css.match(/#c98261/gi) || []).length;

console.log(
  JSON.stringify(
    {
      wrote: css.length !== before.length,
      leftoverWine,
      leftoverRgba,
      leftoverTerra,
    },
    null,
    2,
  ),
);
