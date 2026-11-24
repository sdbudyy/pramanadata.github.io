// Link-preview images (1200×630 PNG) for each study, drawn at build time.
// satori lays the card out with the site's own fonts (text becomes vector
// paths), then resvg turns it into a PNG. Nothing here ships to visitors.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import type { Study } from './studies';
import { studyNo, topicTone } from './studies';
import type { LineView } from './chart';

const require = createRequire(import.meta.url);
const font = (pkg: string, file: string) => readFileSync(require.resolve(`@fontsource/${pkg}/files/${file}`));
const FONTS = [
  { name: 'Plex Sans', data: font('ibm-plex-sans', 'ibm-plex-sans-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'Plex Sans', data: font('ibm-plex-sans', 'ibm-plex-sans-latin-600-normal.woff'), weight: 600 as const, style: 'normal' as const },
  { name: 'Plex Mono', data: font('ibm-plex-mono', 'ibm-plex-mono-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'Plex Mono', data: font('ibm-plex-mono', 'ibm-plex-mono-latin-600-normal.woff'), weight: 600 as const, style: 'normal' as const },
];

const C = { bg: '#10282B', panel: '#0C2124', line: '#24474A', axis: '#4A7176', text: '#ECE6D6', text2: '#B3C2BB', text3: '#8FA6A0', accent: '#FF7A3D', second: '#9CD3F0', warn: '#FFB08A' };

type Node = { type: string; props: Record<string, unknown> & { style?: Record<string, unknown>; children?: unknown } };
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node => ({
  type,
  props: { style, children, ...extra },
});
const svgUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

// The logo mark (confidence ellipse), small-size cut.
const LOGO = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><ellipse cx="60" cy="60" rx="48" ry="27" transform="rotate(-35 60 60)" fill="none" stroke="${C.text}" stroke-width="11"/><circle cx="60" cy="60" r="14" fill="${C.text}"/></svg>`,
);

// A label-free version of the study's main line chart (labels are set as card text).
function chartUri(v: LineView, w: number, hgt: number) {
  const n = v.a.length;
  const x = (i: number) => 8 + (i / (n - 1)) * (w - 16);
  const y = (val: number) => hgt - 10 - ((val - v.yMin) / (v.yMax - v.yMin)) * (hgt - 30);
  const pts = (arr: number[]) => arr.map((val, i) => `${x(i).toFixed(1)},${y(val).toFixed(1)}`).join(' ');
  const grid = v.yTicks
    .filter((t) => t !== v.yMin)
    .map((t) => `<line x1="8" x2="${w - 8}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}" stroke="${C.line}" stroke-width="1.5"/>`)
    .join('');
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${hgt}" width="${w}" height="${hgt}">${grid}` +
      `<line x1="8" x2="${w - 8}" y1="${hgt - 10}" y2="${hgt - 10}" stroke="${C.axis}" stroke-width="2"/>` +
      `<polyline points="${pts(v.b)}" fill="none" stroke="${C.second}" stroke-width="4" stroke-dasharray="10 7" stroke-linejoin="round"/>` +
      `<polyline points="${pts(v.a)}" fill="none" stroke="${C.accent}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>` +
      `<circle cx="${x(n - 1).toFixed(1)}" cy="${y(v.a[n - 1]).toFixed(1)}" r="8" fill="${C.accent}"/>` +
      `<circle cx="${x(n - 1).toFixed(1)}" cy="${y(v.b[n - 1]).toFixed(1)}" r="7" fill="${C.second}"/></svg>`,
  );
}

export async function studyOgPng(study: Study, host: string) {
  const d = study.data;
  const tone = topicTone(d.topic);
  const lead = d.tiles[0];
  const line = d.chart.views.find((v) => v.type === 'line') as LineView | undefined;
  const years = d.chart.years;
  const CW = 450, CH = 230;

  const right = line
    ? h('div', { display: 'flex', flexDirection: 'column', width: CW, flexShrink: 0, gap: 10, paddingTop: 6 }, [
        h('img', { width: CW, height: CH }, undefined, { src: chartUri(line, CW, CH), width: CW, height: CH }),
        h('div', { display: 'flex', justifyContent: 'space-between', fontFamily: 'Plex Mono', fontSize: 18, color: C.text3 }, [
          h('span', {}, years[0]),
          h('span', {}, years[years.length - 1]),
        ]),
        h('div', { display: 'flex', gap: 22, fontSize: 19, color: C.text2 }, [
          h('div', { display: 'flex', alignItems: 'center', gap: 8 }, [h('div', { width: 26, height: 4, background: C.accent }), d.chart.aShort]),
          h('div', { display: 'flex', alignItems: 'center', gap: 8 }, [h('div', { width: 26, height: 0, borderTop: `4px dashed ${C.second}` }), d.chart.bShort]),
          line.yMin !== 0 ? h('span', { fontFamily: 'Plex Mono', fontSize: 15, color: C.text3 }, `axis from ${line.yMin}`) : null,
        ].filter(Boolean)),
      ])
    : null;

  const tree = h(
    'div',
    { width: 1200, height: 630, display: 'flex', flexDirection: 'column', background: C.bg, color: C.text, fontFamily: 'Plex Sans', padding: '36px 56px 30px', borderTop: `8px solid ${C.accent}` },
    [
      // Top bar
      h('div', { display: 'flex', width: 1088, height: 44, justifyContent: 'space-between', alignItems: 'center' }, [
        h('div', { display: 'flex', alignItems: 'center', gap: 14 }, [
          h('img', { width: 40, height: 40 }, undefined, { src: LOGO, width: 40, height: 40 }),
          h('span', { fontFamily: 'Plex Mono', fontWeight: 600, fontSize: 30 }, 'Pramana'),
        ]),
        h('div', { display: 'flex', alignItems: 'center', gap: 12, fontSize: 20 }, [
          h('span', { background: tone.bg, color: tone.fg, padding: '4px 14px', borderRadius: 999, fontWeight: 600 }, d.topic),
          h('span', { fontFamily: 'Plex Mono', color: C.text3 }, studyNo(d.number)),
          d.placeholder
            ? h('span', { fontFamily: 'Plex Mono', color: C.warn, border: `2px solid ${C.warn}`, padding: '2px 10px', borderRadius: 6 }, 'SAMPLE DATA')
            : null,
        ].filter(Boolean)),
      ]),
      // Body
      // Fixed sizes: 1200×630 minus border, padding, top bar and footer.
      h('div', { display: 'flex', width: 1088, height: 436, gap: 44, marginTop: 24 }, [
        h('div', { display: 'flex', flexDirection: 'column', width: line ? 1088 - 44 - CW : 1088, height: '100%', gap: 14 }, [
          h('div', { fontFamily: 'Plex Mono', fontWeight: 600, fontSize: d.title.length > 40 ? 40 : 46, lineHeight: 1.12, letterSpacing: -1 }, d.title),
          h('div', { fontSize: 20, lineHeight: 1.4, color: C.text2, display: 'block', lineClamp: 3 }, d.answer),
          h('div', { display: 'flex', flexDirection: 'column', marginTop: 'auto' }, [
            h('span', { fontFamily: 'Plex Mono', fontSize: 16, color: C.accent }, lead.label.toUpperCase()),
            h('span', { fontFamily: 'Plex Mono', fontWeight: 600, fontSize: 54, lineHeight: 1.05, color: C.accent }, lead.value),
            h('span', { fontSize: 17, color: C.text2 }, lead.note),
          ]),
        ]),
        right,
      ].filter(Boolean)),
      // Footer
      h('div', { display: 'flex', width: 1088, justifyContent: 'space-between', marginTop: 18, paddingTop: 14, borderTop: `2px solid ${C.line}`, fontFamily: 'Plex Mono', fontSize: 18, color: C.text3 }, [
        h('span', {}, host),
        h('span', {}, 'Every source, the method and what it can’t show'),
      ]),
    ],
  );

  const svg = await satori(tree as never, { width: 1200, height: 630, fonts: FONTS });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
