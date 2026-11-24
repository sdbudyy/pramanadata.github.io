// Hand-made SVG charts. These functions return SVG markup as strings so the
// same code draws the chart at build time and redraws it in the browser when
// someone switches view, hovers or taps. No chart library.

export type LineView = {
  type: 'line';
  id: string;
  label: string;
  short?: string;
  a: number[];
  b: number[];
  yMin: number;
  yMax: number;
  yTicks: number[];
  notes?: string[];
};
export type BarView = {
  type: 'bars';
  id: string;
  label: string;
  short?: string;
  unit: string;
  bars: { label: string; value: number }[];
  caption?: string;
};
export type View = LineView | BarView;

export type ChartData = {
  years: string[];
  aShort: string;
  bShort: string;
  annotation?: { index: number; title: string; text: string };
};

export type Layout = {
  w: number;
  h: number;
  x0: number; // plot left
  x1: number; // plot right
  yTop: number; // top of plot (yMax)
  yBase: number; // axis line (yMin)
  yearY: number; // baseline of year labels
  tickX: number; // right edge of y labels
  font: number;
  mobile: boolean;
};

// Sizes copied from the mockups (StudyPage desktop, StudyFromX phone).
export const DESKTOP: Layout = { w: 1100, h: 320, x0: 50, x1: 1090, yTop: 30, yBase: 290, yearY: 312, tickX: 40, font: 12, mobile: false };
export const MOBILE: Layout = { w: 330, h: 214, x0: 30, x1: 326, yTop: 20, yBase: 190, yearY: 207, tickX: 24, font: 10, mobile: true };

export const C = {
  accent: '#FF7A3D',
  second: '#9CD3F0',
  grid: '#24474A',
  axis: '#4A7176',
  muted: '#8FA6A0',
  text2: '#B3C2BB',
  text: '#ECE6D6',
  bg: '#10282B',
  panel: '#0C2124',
  warn: '#FFB08A',
};
const MONO = 'IBM Plex Mono, monospace';

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const f = (n: number) => (Math.round(n * 10) / 10).toString();

export function xAt(L: Layout, i: number, n: number) {
  return n <= 1 ? L.x0 : L.x0 + (i / (n - 1)) * (L.x1 - L.x0);
}
export function yAt(L: Layout, v: LineView, value: number) {
  return L.yBase - ((value - v.yMin) / (v.yMax - v.yMin)) * (L.yBase - L.yTop);
}

/** Nearest year index for an x position in viewBox units. */
export function indexAt(L: Layout, x: number, n: number) {
  const t = (x - L.x0) / (L.x1 - L.x0);
  return Math.max(0, Math.min(n - 1, Math.round(t * (n - 1))));
}

/** Which year labels to print: all on desktop; about four on a phone. */
function yearLabels(L: Layout, years: string[]) {
  const n = years.length;
  if (!L.mobile && n <= 12) return years.map((y, i) => ({ i, t: y }));
  const step = Math.max(1, Math.ceil((n - 1) / 4));
  const out: { i: number; t: string }[] = [];
  for (let i = 0; i < n - 1; i += step) out.push({ i, t: i === 0 ? years[i] : `’${years[i].slice(-2)}` });
  out.push({ i: n - 1, t: `’${years[n - 1].slice(-2)}` });
  return out;
}

function fmt(v: number) {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/** The text in the value pill, e.g. "2023 · 121 / 109" on phones. */
export function tipText(c: ChartData, v: LineView, i: number, mobile: boolean) {
  return mobile
    ? `${c.years[i]} · ${fmt(v.a[i])} / ${fmt(v.b[i])}`
    : `${c.years[i]} · ${c.aShort} ${fmt(v.a[i])} · ${c.bShort} ${fmt(v.b[i])}`;
}

/** Inner markup of the main line chart. `sel` is the year being read (null = none). */
export function lineSvg(L: Layout, c: ChartData, v: LineView, sel: number | null) {
  const n = c.years.length;
  const parts: string[] = [];
  const anchorEnd = (i: number) => (i === n - 1 ? 'end' : i === 0 ? 'start' : 'middle');

  // Grid and axis
  parts.push(`<g stroke="${C.grid}" stroke-width="1">`);
  for (const t of v.yTicks) if (t !== v.yMin) parts.push(`<line x1="${L.x0}" y1="${f(yAt(L, v, t))}" x2="${L.x1}" y2="${f(yAt(L, v, t))}"/>`);
  parts.push(`</g><line x1="${L.x0}" y1="${L.yBase}" x2="${L.x1}" y2="${L.yBase}" stroke="${C.axis}" stroke-width="1"/>`);

  // Labels
  parts.push(`<g font-family="${MONO}" font-size="${L.font}" fill="${C.muted}">`);
  for (const t of v.yTicks) parts.push(`<text x="${L.tickX}" y="${f(yAt(L, v, t) + L.font / 3)}" text-anchor="end">${fmt(t)}</text>`);
  for (const { i, t } of yearLabels(L, c.years))
    parts.push(`<text x="${f(xAt(L, i, n))}" y="${L.yearY}" text-anchor="${anchorEnd(i)}">${esc(t)}</text>`);
  parts.push(`</g>`);

  const pts = (arr: number[]) => arr.map((val, i) => `${f(xAt(L, i, n))},${f(yAt(L, v, val))}`).join(' ');
  const ann = c.annotation;

  // Desktop: annotation box, placed where it does not cover a line.
  if (!L.mobile && ann) {
    const ax = xAt(L, ann.index, n);
    const bw = Math.max(ann.title.length, ann.text.length) * 7.3 + 24;
    const bh = 56;
    const bx = Math.max(L.x0 + 4, Math.min(L.x1 - bw, ax - 34));
    const clear = (by: number) => {
      for (let k = 0; k <= (n - 1) * 4; k++) {
        const t = k / 4;
        const i0 = Math.floor(t), i1 = Math.min(n - 1, i0 + 1), fr = t - i0;
        const x = xAt(L, t, n);
        if (x < bx - 4 || x > bx + bw + 4) continue;
        for (const arr of [v.a, v.b]) {
          const y = yAt(L, v, arr[i0] + (arr[i1] - arr[i0]) * fr);
          if (y > by - 6 && y < by + bh + 6) return false;
        }
      }
      return true;
    };
    const by = [L.yTop + 10, L.yBase - bh - 14, L.yTop + 70].find(clear) ?? L.yTop + 10;
    parts.push(
      `<line x1="${f(ax)}" y1="${L.yTop}" x2="${f(ax)}" y2="${L.yBase}" stroke="${C.axis}" stroke-width="1" stroke-dasharray="2 4"/>`,
      `<rect x="${f(bx)}" y="${by}" width="${f(bw)}" height="${bh}" rx="6" fill="${C.bg}" stroke="${C.axis}"/>`,
      `<g font-family="${MONO}" font-size="12"><text x="${f(bx + 12)}" y="${by + 22}" fill="${C.muted}">${esc(ann.title)}</text><text x="${f(bx + 12)}" y="${by + 42}" fill="${C.text}">${esc(ann.text)}</text></g>`,
    );
  }

  if (sel !== null) {
    const sx = xAt(L, sel, n);
    parts.push(`<line x1="${f(sx)}" y1="${L.yTop - 4}" x2="${f(sx)}" y2="${L.yBase}" stroke="${C.text}" stroke-width="1" stroke-dasharray="2 3" opacity=".6"/>`);
  }

  // Lines: second series first so the lead series sits on top.
  parts.push(
    `<polyline points="${pts(v.b)}" fill="none" stroke="${C.second}" stroke-width="2.5" stroke-dasharray="${L.mobile ? '6 4' : '7 5'}"/>`,
    `<polyline points="${pts(v.a)}" fill="none" stroke="${C.accent}" stroke-width="3"/>`,
  );

  if (sel !== null) {
    const sx = xAt(L, sel, n);
    const r = L.mobile ? 5 : 6;
    parts.push(
      `<circle cx="${f(sx)}" cy="${f(yAt(L, v, v.a[sel]))}" r="${r}" fill="${C.accent}" stroke="${C.panel}" stroke-width="2"/>`,
      `<circle cx="${f(sx)}" cy="${f(yAt(L, v, v.b[sel]))}" r="${r - 0.5}" fill="${C.second}" stroke="${C.panel}" stroke-width="2"/>`,
    );
  }

  // Phone: numbered marker on the annotated year (the note sits under the chart).
  if (L.mobile && ann) {
    const mx = xAt(L, ann.index, n), my = yAt(L, v, v.a[ann.index]);
    parts.push(
      `<circle cx="${f(mx)}" cy="${f(my)}" r="9" fill="${C.bg}" stroke="${C.text}"/>`,
      `<text x="${f(mx)}" y="${f(my + 3.5)}" text-anchor="middle" font-family="${MONO}" font-size="10" fill="${C.text}">1</text>`,
    );
  }

  if (sel !== null) {
    const sx = xAt(L, sel, n);
    const text = tipText(c, v, sel, L.mobile);
    const fs = L.mobile ? 10.5 : 13;
    const tw = text.length * fs * 0.62 + (L.mobile ? 14 : 22);
    const th = L.mobile ? 20 : 26;
    const tx = Math.max(L.x0, Math.min(L.x1 - tw, sx - tw / 2));
    parts.push(
      `<rect x="${f(tx)}" y="${L.mobile ? 0 : 0}" width="${f(tw)}" height="${th}" rx="4" fill="${C.text}"/>`,
      `<text x="${f(tx + tw / 2)}" y="${L.mobile ? 14 : 18}" text-anchor="middle" font-family="${MONO}" font-size="${fs}" font-weight="600" fill="${C.bg}">${esc(text)}</text>`,
    );
  }
  return parts.join('');
}

/** Inner markup of a ranked horizontal bar chart (largest in orange). Bars start at zero. */
export function hbarsSvg(L: { w: number; mobile: boolean }, bars: { label: string; value: number }[], unit: string) {
  const max = Math.max(...bars.map((b) => b.value), 0) || 1;
  const top = bars.reduce((m, b, i) => (b.value > bars[m].value ? i : m), 0);
  const fs = L.mobile ? 12 : 13;
  const longest = Math.max(...bars.map((b) => b.label.length));
  const lx = Math.max(44, longest * fs * 0.62 + 12);
  const valW = 70;
  const bh = L.mobile ? 22 : 24;
  const gap = L.mobile ? 14 : 26;
  const maxW = L.w - lx - valW;
  const parts: string[] = [];
  bars.forEach((b, i) => {
    const y = 8 + i * (bh + gap);
    const w = Math.max(0, (b.value / max) * maxW);
    const value = `${b.value > 0 && unit.includes('pt') ? '+' : ''}${fmt(b.value)}${unit}`;
    parts.push(
      `<text x="0" y="${y + bh / 2 + fs / 3}" font-family="${MONO}" font-size="${fs}" fill="${C.text2}">${esc(b.label)}</text>`,
      `<rect x="${f(lx)}" y="${y}" width="${f(w)}" height="${bh}" rx="3" fill="${i === top ? C.accent : C.axis}"/>`,
      `<text x="${f(lx + w + 6)}" y="${y + bh / 2 + fs / 3}" font-family="${MONO}" font-size="${fs}" fill="${C.text}">${esc(value)}</text>`,
    );
  });
  const h = 8 + bars.length * (bh + gap) - gap + 8;
  return { h, inner: parts.join('') };
}

/** Inner markup of a vertical bar chart from zero, with an optional reference line. */
export function vbarsSvg(
  L: { w: number; mobile: boolean },
  bars: { label: string; value: number }[],
  unit: string,
  refLine?: { value: number; label: string },
) {
  const h = L.mobile ? 170 : 200;
  const base = h - 20;
  const plotTop = 16;
  const max = Math.max(...bars.map((b) => b.value), refLine?.value ?? 0) * 1.12 || 1;
  const y = (v: number) => base - (v / max) * (base - plotTop);
  const slot = L.w / bars.length;
  const bw = Math.min(L.mobile ? 38 : 50, slot * 0.66);
  const top = bars.reduce((m, b, i) => (b.value > bars[m].value ? i : m), 0);
  const fs = L.mobile ? 10 : 12;
  const parts: string[] = [`<line x1="0" y1="${base}" x2="${L.w}" y2="${base}" stroke="${C.axis}"/>`];
  bars.forEach((b, i) => {
    const cx = slot * i + slot / 2;
    parts.push(
      `<rect x="${f(cx - bw / 2)}" y="${f(y(b.value))}" width="${f(bw)}" height="${f(base - y(b.value))}" rx="3" fill="${i === top ? C.accent : C.axis}"/>`,
      `<text x="${f(cx)}" y="${f(y(b.value) - 5)}" text-anchor="middle" font-family="${MONO}" font-size="${fs}" fill="${C.text}">${esc(fmt(b.value) + unit)}</text>`,
      `<text x="${f(cx)}" y="${base + 14}" text-anchor="middle" font-family="${MONO}" font-size="${fs}" fill="${C.muted}">${esc(b.label)}</text>`,
    );
  });
  if (refLine) {
    const ry = y(refLine.value);
    parts.push(
      `<line x1="0" y1="${f(ry)}" x2="${L.w}" y2="${f(ry)}" stroke="${C.warn}" stroke-dasharray="4 4"/>`,
      `<text x="2" y="${f(ry - 6)}" font-family="${MONO}" font-size="${fs}" fill="${C.warn}">${esc(refLine.label)}</text>`,
    );
  }
  return { h, inner: parts.join('') };
}

/** Plain-language description for screen readers. */
export function lineLabel(c: ChartData & { aLabel: string; bLabel: string }, v: LineView) {
  const n = c.years.length - 1;
  return `Line chart, ${c.years[0]} to ${c.years[n]}. ${c.aLabel} goes from ${fmt(v.a[0])} to ${fmt(v.a[n])}; ${c.bLabel} goes from ${fmt(v.b[0])} to ${fmt(v.b[n])}.`;
}
