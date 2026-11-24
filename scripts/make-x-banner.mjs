// Draws the X (Twitter) profile banner: design/brand/x-banner-1500x500.png
// Run: node scripts/make-x-banner.mjs
// X overlays the round profile photo on the bottom-left and crops the top and
// bottom on phones, so everything important sits in the middle band, right of
// the photo. The lines on the right are decoration only: no axis, no numbers.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const require = createRequire(import.meta.url);
const font = (pkg, file) => readFileSync(require.resolve(`@fontsource/${pkg}/files/${file}`));
const fonts = [
  { name: 'Plex Mono', data: font('ibm-plex-mono', 'ibm-plex-mono-latin-600-normal.woff'), weight: 600, style: 'normal' },
  { name: 'Plex Sans', data: font('ibm-plex-sans', 'ibm-plex-sans-latin-400-normal.woff'), weight: 400, style: 'normal' },
];
const W = 1500, H = 500;
const C = { bg: '#10282B', grid: '#ECE6D60F', text: '#ECE6D6', text2: '#B3C2BB', accent: '#FF7A3D', second: '#9CD3F0', line: '#24474A' };
const uri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

// Background: petrol with the site's 40 px grid.
let grid = '';
for (let x = 0; x <= W; x += 40) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${C.grid}" stroke-width="1"/>`;
for (let y = 0; y <= H; y += 40) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${C.grid}" stroke-width="1"/>`;

// Decorative lines with a soft range band, right side.
const xs = [1070, 1128, 1186, 1244, 1302, 1360, 1418, 1476];
const a = [330, 318, 300, 270, 236, 206, 184, 170];
const b = [330, 326, 318, 310, 300, 292, 286, 280];
const pts = (ys) => xs.map((x, i) => `${x},${ys[i]}`).join(' ');
const band = xs.map((x, i) => `${x},${a[i] - 18 - i * 3}`).join(' ') + ' ' + xs.slice().reverse().map((x, i) => `${x},${a[xs.length - 1 - i] + 18 + (xs.length - 1 - i) * 3}`).join(' ');
const art =
  `<polygon points="${band}" fill="${C.accent}" opacity="0.08"/>` +
  `<line x1="1050" y1="360" x2="1500" y2="360" stroke="#4A7176" stroke-width="2"/>` +
  `<polyline points="${pts(b)}" fill="none" stroke="${C.second}" stroke-width="4" stroke-dasharray="12 9" stroke-linecap="round"/>` +
  `<polyline points="${pts(a)}" fill="none" stroke="${C.accent}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<circle cx="1476" cy="170" r="8" fill="${C.accent}"/>`;

const bg = uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${C.bg}"/>${grid}${art}</svg>`);
const mark = uri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><ellipse cx="60" cy="60" rx="50" ry="26" transform="rotate(-35 60 60)" fill="none" stroke="${C.text}" stroke-width="8"/><circle cx="60" cy="60" r="11" fill="${C.text}"/></svg>`,
);

const el = (type, style, children, props = {}) => ({ type, props: { style, children, ...props } });
const tree = el('div', { width: W, height: H, display: 'flex', position: 'relative' }, [
  el('img', { position: 'absolute', left: 0, top: 0, width: W, height: H }, undefined, { src: bg, width: W, height: H }),
  el('div', { position: 'absolute', left: 320, top: 128, display: 'flex', flexDirection: 'column', gap: 16 }, [
    el('div', { display: 'flex', alignItems: 'center', gap: 22 }, [
      el('img', { width: 84, height: 84 }, undefined, { src: mark, width: 84, height: 84 }),
      el('span', { fontFamily: 'Plex Mono', fontWeight: 600, fontSize: 76, color: C.text, letterSpacing: -2 }, 'Pramana'),
    ]),
    el('span', { fontFamily: 'Plex Sans', fontSize: 34, color: C.text2 }, 'Calgary, Alberta and Canada, in data. No spin.'),
    el('span', { fontFamily: 'Plex Mono', fontWeight: 600, fontSize: 22, color: C.accent, letterSpacing: 1 }, 'EVERY SOURCE · EVERY METHOD · EVERY CORRECTION'),
  ]),
]);

const svg = await satori(tree, { width: W, height: H, fonts });
writeFileSync('design/brand/x-banner-1500x500.png', new Resvg(svg).render().asPng());
console.log('wrote design/brand/x-banner-1500x500.png');
