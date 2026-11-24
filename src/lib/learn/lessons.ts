// The seven Learn lessons: state + view(state) → HTML for each slot.
// Logic and copy are ported from design/mockups/Learn.dc.html. Every number
// here is illustrative and is labelled that way on the page.
import { esc, pop, ACCENT } from './core';

const MONO = "'IBM Plex Mono', monospace";
const money = (v: number) => '$' + Math.round(v).toLocaleString('en-CA');

// ---------------------------------------------------------------- 1 · Tricks
const yrs = ['15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25'];
const rent = [1150, 1170, 1180, 1190, 1200, 1210, 1230, 1330, 1500, 1620, 1700];
const scale = (vals: number[], lo: number, hi: number) => vals.map((v) => Math.max(2, ((v - lo) / (hi - lo)) * 100));
type Mode = 'a' | 'b' | 'h';
type BarMode = { headline: string; top: string; bottom: string; labels: string[]; vals: number[]; h: number[]; fmt?: string; note: string };
type WinMode = { headline: string; window: [number, number] };
type Trick = { name: string; what: string; spot: string; fix: string; win?: boolean; modes: Record<Mode, BarMode | WinMode> };

const TRICKS: Trick[] = [
  {
    name: 'Cropped axis',
    what: 'Start the y-axis just below the smallest value, so a small change fills the whole chart.',
    spot: 'Look at where the y-axis starts. If it isn’t zero on a bar chart, the bars are exaggerating.',
    fix: 'Bar charts always start at zero. If a small change matters, I say so in words and show the actual numbers.',
    modes: {
      a: { headline: 'Rent SOARS in one year', top: '$1,710', bottom: '$1,600', labels: ['2024', '2025'], vals: [1620, 1700], h: scale([1620, 1700], 1600, 1710), note: 'Axis starts at $1,600' },
      b: { headline: 'Rent edges up slightly', top: '$4,000', bottom: '$0', labels: ['2024', '2025'], vals: [1620, 1700], h: scale([1620, 1700], 0, 4000), note: 'Axis stretched to $4,000' },
      h: { headline: 'Rent rose $80 (about 5%)', top: '$1,800', bottom: '$0', labels: ['2024', '2025'], vals: [1620, 1700], h: scale([1620, 1700], 0, 1800), note: 'Axis from zero, sized to the data' },
    },
  },
  {
    name: 'Cherry-picked window',
    what: 'Choose the start and end years that tell the story you want, and leave out the rest.',
    spot: 'Ask why the chart starts and ends where it does. Look for the longest range the data allows.',
    fix: 'I show the full history, explain my chosen window, and test whether the result holds for other start years.',
    win: true,
    modes: {
      a: { headline: 'Rent up 38% in four years', window: [6, 10] },
      b: { headline: 'Rent up just 5% in five years', window: [0, 5] },
      h: { headline: '+48% over ten years, mostly since 2022', window: [0, 10] },
    },
  },
  {
    name: 'Totals vs per person',
    what: 'Report a raw total when the population is growing, or a rate when the total is what matters.',
    spot: 'Check whether the number is a total or per person, per vehicle or per household, and whether the population changed.',
    fix: 'I show both when the base is growing, and say which one answers the question.',
    modes: {
      a: { headline: 'Collisions hit a record high', top: '10,500', bottom: '0', labels: ['2022', '2023', '2024', '2025'], vals: [9000, 9400, 9800, 10100], h: scale([9000, 9400, 9800, 10100], 0, 10500), fmt: 'int', note: 'Total collisions' },
      b: { headline: 'Roads are getting safer', top: '16', bottom: '0', labels: ['2022', '2023', '2024', '2025'], vals: [15.0, 14.7, 14.2, 13.7], h: scale([15, 14.7, 14.2, 13.7], 0, 16), fmt: 'dec', note: 'Collisions per 1,000 vehicles' },
      h: { headline: 'More crashes, more cars: rate down 9%', top: '16', bottom: '0', labels: ['2022', '2023', '2024', '2025'], vals: [15.0, 14.7, 14.2, 13.7], h: scale([15, 14.7, 14.2, 13.7], 0, 16), fmt: 'dec', note: 'Rate per 1,000 vehicles, with totals in the text' },
    },
  },
  {
    name: 'Percent vs points',
    what: 'A rate going from 4% to 6% can be called “up 2 points” or “up 50%”. Both are true; one sounds alarming.',
    spot: 'When a percentage changes, check whether the headline means percentage points or percent change.',
    fix: 'I report percentage points for rates and give the starting level, so readers can judge the size themselves.',
    modes: {
      a: { headline: 'Unemployment up 50%!', top: '7%', bottom: '0%', labels: ['Last year', 'This year'], vals: [4, 6], h: scale([4, 6], 0, 7), fmt: 'pct', note: 'Unemployment rate' },
      b: { headline: 'Unemployment ticks up 2 points', top: '7%', bottom: '0%', labels: ['Last year', 'This year'], vals: [4, 6], h: scale([4, 6], 0, 7), fmt: 'pct', note: 'Same chart, different words' },
      h: { headline: 'Up 2 points, from 4% to 6%', top: '7%', bottom: '0%', labels: ['Last year', 'This year'], vals: [4, 6], h: scale([4, 6], 0, 7), fmt: 'pct', note: 'Points and starting level, together' },
    },
  },
];
const fmtV = (v: number, f?: string) =>
  f === 'int' ? v.toLocaleString('en-CA') : f === 'dec' ? v.toFixed(1) : f === 'pct' ? v + '%' : money(v);

export type TricksS = { trick: number; mode: Mode };
export const tricksInit: TricksS = { trick: 0, mode: 'a' };
const MODE_COL: Record<Mode, string> = { a: ACCENT, b: '#9CD3F0', h: '#ECE6D6' };

export function tricksView(s: TricksS) {
  const t = TRICKS[s.trick];
  const m = t.modes[s.mode];
  const col = MODE_COL[s.mode];
  let top: string, bottom: string, note: string, label: string;
  let bars: { label: string; value: string; h: number; op: number }[];
  if (t.win) {
    const w = (m as WinMode).window;
    const inW = (i: number) => i >= w[0] && i <= w[1];
    top = '$1,800'; bottom = '$0';
    note = `Showing 20${yrs[w[0]]}–20${yrs[w[1]]}`;
    bars = rent.map((v, i) => ({ label: '’' + yrs[i], value: '', h: inW(i) ? (v / 1800) * 100 : 2, op: inW(i) ? 1 : 0.15 }));
    label = `${m.headline}: rent by year, ${note}`;
  } else {
    const b = m as BarMode;
    top = b.top; bottom = b.bottom; note = b.note;
    bars = b.vals.map((v, i) => ({ label: b.labels[i], value: fmtV(v, b.fmt), h: b.h[i], op: 1 }));
    label = `${b.headline}: ${b.vals.map((v, i) => `${b.labels[i]} ${fmtV(v, b.fmt)}`).join(', ')}`;
  }
  const tabs = TRICKS.map((x, i) => {
    const on = i === s.trick;
    return `<button type="button" role="tab" aria-selected="${on}" data-act="trick" data-arg="${i}" class="tab${on ? ' on' : ''}"><span class="num">0${i + 1}</span> ${esc(x.name)}</button>`;
  }).join('');
  const modes = (['a', 'b', 'h'] as Mode[])
    .map((k) => {
      const on = s.mode === k;
      const lbl = k === 'a' ? 'Story A' : k === 'b' ? 'Story B' : 'Honest version';
      return `<button type="button" aria-pressed="${on}" data-act="mode" data-arg="${k}" class="pill${on ? ' on' : ''}" style="--c:${MODE_COL[k]}">${lbl}</button>`;
    })
    .join('');
  return {
    tabs,
    modes,
    headline: `<span class="${pop()}" style="color:${col}">${esc(m.headline)}</span>`,
    axis: `<span>${esc(top)}</span><span>${esc(bottom)}</span>`,
    bars: bars
      .map(
        (b) =>
          `<div class="col"><span class="val" style="opacity:${b.op}">${esc(b.value)}</span><span class="bar" style="height:${b.h.toFixed(1)}%;background:${col};opacity:${b.op}"></span></div>`,
      )
      .join(''),
    labels: bars.map((b) => `<span style="opacity:${b.op}">${esc(b.label)}</span>`).join(''),
    note: `${esc(note)} · illustrative numbers`,
    chartLabel: esc(label),
    name: esc(t.name),
    what: esc(t.what),
    spot: esc(t.spot),
    fix: esc(t.fix),
  };
}

// ------------------------------------------------------------ 2 · Newsrooms
export type NewsS = { rent: number };
export const newsInit: NewsS = { rent: 4 };
const WAGE = 3.0, CPI = 2.5;
const f1 = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1);
const mix = (c1: string, c2: string, t: number) =>
  '#' + [0, 2, 4].map((i) => Math.round(parseInt(c1.substr(i + 1, 2), 16) * (1 - t) + parseInt(c2.substr(i + 1, 2), 16) * t).toString(16).padStart(2, '0')).join('');

export function newsView(s: NewsS) {
  const r = s.rent, a = Math.abs(r);
  let A: { h: string; t: string }, B: { h: string; t: string };
  if (r >= 8) { A = { h: `Rents SKYROCKET ${r.toFixed(1)}%. Calgarians priced out!`, t: 'Families forced out' }; B = { h: 'Booming demand: everyone wants to live in Calgary', t: 'City on the rise' }; }
  else if (r >= 3) { A = { h: `Rent up ${r.toFixed(1)}% AGAIN, beating inflation for another year`, t: 'Renters squeezed' }; B = { h: `Rent growth of ${r.toFixed(1)}% shows a healthy, growing city`, t: 'Steady growth' }; }
  else if (r > 0) { A = { h: `Rents still climbing, up ${r.toFixed(1)}%. No relief in sight`, t: 'Still rising' }; B = { h: r < CPI ? `Rents up only ${r.toFixed(1)}%, slower than inflation` : `Rents up ${r.toFixed(1)}%, in line with inflation`, t: 'Rents under control' }; }
  else if (r === 0) { A = { h: 'Rents frozen at record highs. Renters get no break', t: 'Stuck at the top' }; B = { h: 'Rents hold steady: stability for renters', t: 'Calm market' }; }
  else if (r > -3) { A = { h: `Rents dip just ${a.toFixed(1)}%, still near all-time highs`, t: 'Barely a dent' }; B = { h: `Good news for renters: rents fall ${a.toFixed(1)}%`, t: 'Relief arrives' }; }
  else { A = { h: `Rents PLUNGE ${a.toFixed(1)}%. Is Calgary’s economy collapsing?`, t: 'Warning signs' }; B = { h: `Big win for renters: rents drop ${a.toFixed(1)}%`, t: 'Renters win' }; }
  const leftA = r > 0
    ? r <= WAGE ? `Wages rose ${WAGE.toFixed(1)}%, faster than rent.` : `Wages also rose ${WAGE.toFixed(1)}%, so the real squeeze is ${(r - WAGE).toFixed(1)} points, not ${r.toFixed(1)}%.`
    : r === 0 ? `Flat rent while wages rose ${WAGE.toFixed(1)}% means rent got more affordable.` : 'Falling rent makes housing more affordable for most renters.';
  const leftB = r > WAGE ? `Rent grew ${(r - WAGE).toFixed(1)} points faster than wages, so renters fell further behind.` : r > 0 ? 'Rent is still rising from an already high level.' : 'Rents can fall because demand weakens, and that can come with job losses.';
  const honest = r > WAGE ? `Rent rose ${r.toFixed(1)}%, ${(r - WAGE).toFixed(1)} points faster than wages.`
    : r > 0 ? `Rent rose ${r.toFixed(1)}%, slower than wages (${WAGE.toFixed(1)}%), so it got slightly more affordable.`
    : r === 0 ? `Rent was flat while wages rose ${WAGE.toFixed(1)}%.` : `Rent fell ${a.toFixed(1)}% while wages rose ${WAGE.toFixed(1)}%.`;
  const ticker = (name: string, t: string) => Array(3).fill(`${name} · ${t.toUpperCase()}`).join(' · ');
  const p = pop();
  return {
    out: f1(r) + '%',
    numA: f1(r) + '%',
    numB: f1(r) + '%',
    arrowA: r > 0 ? '▲ RISING' : r < 0 ? '▼ FALLING' : '■ FLAT',
    arrowB: r > 0 ? '▲ GROWING' : r < 0 ? '▼ EASING' : '■ STEADY',
    headA: `<span class="${p}">${esc(A.h)}</span>`,
    headB: `<span class="${p}">${esc(B.h)}</span>`,
    tickA: esc(ticker('STATION A', A.t)),
    tickB: esc(ticker('STATION B', B.t)),
    leftA: esc(leftA),
    leftB: esc(leftB),
    honest: `<span class="${p}">${esc(honest)}</span>`,
    vsWage: f1(r - WAGE) + ' pts',
    real: f1(r - CPI) + '%',
  };
}
export const newsBg = (r: number) => mix('#3A2418', '#7A1F14', Math.min(1, Math.abs(r - 2) / 8));

// ------------------------------------------------------- 3 · Average/median
export type AvmS = { hiOn: boolean; hi: number; compact: boolean };
export const avmInit: AvmS = { hiOn: false, hi: 1500, compact: false };
const kfmt = (v: number) => (v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'M' : '$' + Math.round(v) + 'k');
const BASE = [32, 38, 41, 45, 48, 52, 55, 61, 68, 74];

export function avmView(s: AvmS) {
  const list = s.hiOn ? BASE.concat([s.hi]) : BASE.slice();
  const sorted = list.slice().sort((x, y) => x - y);
  const n = sorted.length;
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const mean = list.reduce((x, y) => x + y, 0) / n;
  const rentYr = 18;
  // Phones get a shorter chart; everything scales together.
  const maxPx = s.compact ? 250 : 470;
  const pxk = (2.6 * maxPx) / 470;
  const baseMean = BASE.reduce((x, y) => x + y, 0) / BASE.length;
  const hiPx = s.hi * pxk, capped = s.hiOn && hiPx > maxPx;
  const meanPx = mean * pxk, ghostPx = baseMean * pxk;
  const meanPos = Math.min(maxPx + 60, meanPx);
  const people = BASE.map((v) => ({ label: kfmt(v), h: v * pxk, color: '#4A7176', op: 1, cls: 'bar', capped: false, hi: false }))
    .concat([{ label: s.hiOn ? kfmt(s.hi) : '?', h: s.hiOn ? Math.min(maxPx, hiPx) : 8, color: ACCENT, op: s.hiOn ? 1 : 0.25, cls: 'shootbar', capped, hi: true }]);
  const times = (hiPx / maxPx).toFixed(1);
  const chart =
    people
      .map(
        (pp) =>
          `<div class="pcol" style="opacity:${pp.op}"><span class="plabel${pp.hi && s.hiOn ? ' hi' : ''}">${esc(pp.label)}</span>${
            pp.capped ? `<span class="keeps" aria-hidden="true">↑ keeps going<br>${times}× this chart</span>` : ''
          }<span class="head" style="background:${pp.color}"></span><span class="${pp.cls}" style="height:${pp.h.toFixed(0)}px;background:${pp.color};${pp.capped ? 'border-top:4px dashed #FFC2A0' : ''}"></span></div>`,
      )
      .join('') +
    (s.hiOn
      ? `<div class="line ghost" style="bottom:${ghostPx.toFixed(0)}px"></div>` +
        `<div class="pull" aria-hidden="true" style="bottom:${ghostPx.toFixed(0)}px;height:${Math.max(0, meanPos - ghostPx - 12).toFixed(0)}px"><span></span></div>` +
        `<div class="line pullnote" style="bottom:${Math.min(maxPx + 52, meanPos + 14).toFixed(0)}px"><strong>+${kfmt(mean - baseMean)}</strong> One person pulled the average up from ${kfmt(baseMean)} to ${kfmt(mean)}.</div>`
      : '') +
    `<div class="line med" style="bottom:${(median * pxk).toFixed(0)}px"><span>MEDIAN ${kfmt(median)}</span></div>` +
    `<div class="line mean" style="bottom:${meanPos.toFixed(0)}px"><span>AVERAGE ${kfmt(mean)}${meanPx > maxPx + 60 ? ' ↑ off the chart' : ''}</span></div>`;
  const p = pop();
  return {
    toggle: s.hiOn
      ? `<button type="button" data-act="toggle" aria-pressed="true" class="btn-on">High earner is in the room ✓</button>`
      : `<button type="button" data-act="toggle" aria-pressed="false" class="btn-off">+ Invite one high earner</button>`,
    out: kfmt(s.hi),
    chart,
    chartLabel: esc(`Incomes of ${n} renters; median ${kfmt(median)}, average ${kfmt(mean)}`),
    caption: esc(
      s.hiOn
        ? (capped ? `Drawn to scale up to the top of the chart. At ${kfmt(s.hi)}, the high earner’s bar would really be ${times}× taller than this whole chart.` : 'Everyone drawn to the same scale.') + ' Illustrative incomes.'
        : 'Ten renters, drawn to scale. Illustrative incomes.',
    ),
    pr1: `<span class="${p}">“Renters here earn ${kfmt(mean)} on average. Rent takes ${rentYr / mean < 0.3 ? 'just ' : ''}${((rentYr / mean) * 100).toFixed(0)}% of income.”</span>`,
    pr2: `<span class="${p}">“Half of these renters earn under ${kfmt(median)}. Rent eats ${((rentYr / median) * 100).toFixed(0)}% of their pay.”</span>`,
    honest: esc(
      s.hiOn
        ? `The typical (median) renter earns ${kfmt(median)}. The average is ${kfmt(mean)} only because one person earns ${kfmt(s.hi)}. Ten of eleven people earn less than the average.`
        : `With no outliers, the average (${kfmt(mean)}) and median (${kfmt(median)}) are close, so either is fair. Now invite the high earner.`,
    ),
  };
}

// --------------------------------------------------------- 4 · Correlation
const rngF = (seed: number) => {
  let q = seed >>> 0;
  return () => {
    q = (q + 0x6d2b79f5) >>> 0;
    let t = q;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296 - 0.5;
  };
};
const pearson = (x: number[], y: number[]) => {
  const k = x.length, mx = x.reduce((a, b) => a + b, 0) / k, my = y.reduce((a, b) => a + b, 0) / k;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < k; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
  return sxy / Math.sqrt(sxx * syy);
};
const diff = (a: number[]) => a.slice(1).map((v, i) => v - a[i]);
const PAIRS = [
  { name: 'Ice cream vs hail claims', nameA: 'Ice cream sales', nameB: 'Hail damage claims', pattern: 'season', hidden: 'Summer', stamp: 'MISSING: SUMMER', xStart: 'Jan 2023', xEnd: 'Dec 2024',
    viral: 'Ice cream sales and hail damage claims rise and fall together. Coincidence? We don’t think so.',
    lesson: 'Both peak in summer. Remove the season and the link vanishes: neither causes the other.',
    make: () => { const r = rngF(7), A: number[] = [], B: number[] = []; for (let m = 0; m < 24; m++) { const sv = Math.max(0, Math.sin((2 * Math.PI * ((m % 12) - 3)) / 12)); A.push(20 + 80 * sv + r() * 16); B.push(5 + 60 * Math.pow(sv, 1.3) + r() * 12); } return { A, B }; },
    clean: (a: number[]) => a.map((v, i) => v - (a[i % 12] + a[(i % 12) + 12]) / 2) },
  { name: 'Population vs streaming subs', nameA: 'Calgary population', nameB: 'Streaming subscriptions', pattern: 'trend', hidden: 'Time: both just grow', stamp: 'MISSING: TIME TREND', xStart: '2012', xEnd: '2025',
    viral: 'Every time streaming subscriptions go up, Calgary’s population grows. Netflix is building our city!',
    lesson: 'Anything that grows over time correlates with anything else that grows. Compare year-over-year changes instead.',
    make: () => { const r = rngF(11), A: number[] = [], B: number[] = []; for (let t = 0; t < 14; t++) { A.push(1200 + 35 * t + r() * 30); B.push(10 + 4 * t + r() * 4); } return { A, B }; },
    clean: diff },
  { name: 'Oil price vs rent', nameA: 'Oil price', nameB: 'Calgary rent', pattern: 'trend', hidden: 'Jobs and migration?', stamp: 'PLAUSIBLE, NOT PROVEN', xStart: '2010', xEnd: '2025',
    viral: 'Oil goes up, rent goes up. Oil companies are setting your rent!',
    lesson: 'A real link is plausible here: oil drives jobs, jobs drive migration, migration drives rent. But correlation alone can’t show it. You’d need the mechanism, the timing and other causes ruled out.',
    make: () => { const r = rngF(5), A = [80], B = [1000]; for (let t = 1; t < 16; t++) { const d = r() * 30; A.push(Math.max(30, A[t - 1] + d)); B.push(B[t - 1] + 20 + 1.6 * d + r() * 50); } return { A, B }; },
    clean: diff },
];
export type CorS = { pair: number; detrend: boolean };
export const corInit: CorS = { pair: 0, detrend: false };

export function corView(s: CorS) {
  const pd = PAIRS[s.pair];
  const raw = pd.make();
  const sa = s.detrend ? pd.clean(raw.A) : raw.A, sb = s.detrend ? pd.clean(raw.B) : raw.B;
  const norm = (a: number[]) => { const lo = Math.min(...a), hi = Math.max(...a); return a.map((v) => (v - lo) / (hi - lo || 1)); };
  const zs = (a: number[]) => { const m = a.reduce((x, y) => x + y, 0) / a.length; const sd = Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length) || 1; return a.map((v) => Math.max(0, Math.min(1, 0.5 + (v - m) / sd / 5))); };
  const na = s.detrend ? zs(sa) : norm(sa), nb = s.detrend ? zs(sb) : norm(sb);
  const toPts = (a: number[]) => a.map((v, i) => `${(40 + (i / (a.length - 1)) * 560).toFixed(1)},${(220 - v * 200).toFixed(1)}`).join(' ');
  const r = pearson(sa, sb);
  const rTxt = (r >= 0 ? '' : '−') + Math.abs(r).toFixed(2);
  return {
    pairs: PAIRS.map((p, i) => `<button type="button" data-act="pair" data-arg="${i}" aria-pressed="${i === s.pair}" class="opt${i === s.pair ? ' on' : ''}">${esc(p.name)}</button>`).join(''),
    toggle: s.detrend
      ? `<button type="button" data-act="detrend" class="green on">← Show the raw data</button>`
      : `<button type="button" data-act="detrend" class="green">Remove the shared ${pd.pattern} →</button>`,
    title: esc(s.detrend ? `After removing the shared ${pd.pattern}` : 'Raw data, two axes: they look linked'),
    r: `<strong style="color:${Math.abs(r) > 0.6 ? ACCENT : '#9FE0B8'}">${rTxt}</strong>`,
    lines:
      `<polyline points="${toPts(na)}" fill="none" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<polyline points="${toPts(nb)}" fill="none" stroke="#9CD3F0" stroke-width="2.5" stroke-dasharray="6 4"/>` +
      `<g font-family="${MONO}" font-size="11" fill="#8FA6A0"><text x="40" y="246">${esc(pd.xStart)}</text><text x="600" y="246" text-anchor="end">${esc(pd.xEnd)}</text><text x="34" y="24" text-anchor="end">${s.detrend ? 'high' : 'A'}</text><text x="606" y="24" fill="#9CD3F0">${s.detrend ? '' : 'B'}</text></g>`,
    chartLabel: esc(`${pd.nameA} and ${pd.nameB}, correlation ${r.toFixed(2)}`),
    legend: `<span><span style="color:${ACCENT}">━━</span> ${esc(pd.nameA)}</span><span><span style="color:#9CD3F0">╌╌</span> ${esc(pd.nameB)}</span><span class="mnote">${esc(s.detrend ? `Deviations from the shared ${pd.pattern}, same scale` : 'Each line on its own axis')} · illustrative data</span>`,
    viral: esc(pd.viral),
    stamp: s.detrend ? `<div class="stamp">${esc(pd.stamp)}</div>` : '',
    diagram: `<span class="hid">${esc(pd.hidden)}</span><span class="arrows">↙ ↘</span><div class="pair"><span style="border-color:${ACCENT}">${esc(pd.nameA)}</span><span style="border-color:#9CD3F0">${esc(pd.nameB)}</span></div>`,
    diagramLabel: esc(`${pd.hidden} drives both ${pd.nameA} and ${pd.nameB}`),
    lesson: esc(pd.lesson),
  };
}

// ------------------------------------------------------ 5 · Make it misleading
const rentS = [1150, 1170, 1180, 1190, 1200, 1210, 1230, 1330, 1500, 1620, 1700];
const wageS = [5000, 4950, 5000, 5100, 5200, 5250, 5350, 5450, 5550, 5680, 5800];
export type TrickKey = 'crop' | 'cherry' | 'frame' | 'context' | 'words';
export const TRICK_KEYS: TrickKey[] = ['crop', 'cherry', 'frame', 'context', 'words'];
export type MkS = { goal: 'crisis' | 'calm'; tricks: Record<TrickKey, boolean> };
export const mkInit: MkS = { goal: 'crisis', tricks: { crop: false, cherry: false, frame: false, context: false, words: false } };
const NAMES: Record<TrickKey, string> = { crop: 'Crop the axis', cherry: 'Cherry-pick the years', frame: 'Reframe the number', context: 'Drop the context', words: 'Loaded words' };
const VERDICTS = ['Honest', 'A gentle nudge', 'Spin', 'Heavy spin', 'Propaganda-grade', 'Maximum spin'];

export function mkModel(s: MkS) {
  const crisis = s.goal === 'crisis';
  const T = s.tricks;
  const w: [number, number] = T.cherry ? (crisis ? [6, 10] : [0, 5]) : [0, 10];
  const v0 = rentS[w[0]], v1 = rentS[w[1]], dRent = v1 - v0, pRent = Math.round((dRent / v0) * 100), pWage = Math.round((wageS[w[1]] / wageS[w[0]] - 1) * 100), yrsN = w[1] - w[0];
  const inWin = rentS.slice(w[0], w[1] + 1);
  const lo = T.crop ? (crisis ? Math.min(...inWin) * 0.97 : 0) : 0;
  const hi = T.crop ? (crisis ? Math.max(...inWin) * 1.01 : 4000) : 1800;
  const head = crisis
    ? (T.words ? 'Rents EXPLODE' : 'Rent rises') + (T.frame ? ` +${pRent}%` : ` ${money(dRent)}/month (+${pRent}%)`) + (T.cherry ? ` in just ${yrsN} years` : ` since ${2015 + w[0]}`) + (T.context ? '' : `, while wages rose ${pWage}%`) + (T.words ? '!' : '')
    : (T.words ? 'Rents barely budge:' : 'Rent rises') + (T.frame ? ` just ${money(dRent / 30)} more a day` : ` ${money(dRent)}/month (+${pRent}%)`) + (T.cherry ? ` over ${yrsN} years` : ` since ${2015 + w[0]}`) + (T.context ? '' : `, while wages rose ${pWage}%`) + (T.words ? '. Nothing to see here' : '');
  const score = TRICK_KEYS.filter((k) => T[k]).length * 20;
  const bars = rentS.map((v, i) => {
    const inside = i >= w[0] && i <= w[1];
    return { h: inside ? Math.max(2, Math.min(100, ((v - lo) / (hi - lo)) * 100)) : 2, op: inside ? 1 : 0.12 };
  });
  return {
    crisis, score, head, lo, hi, w, bars,
    barCol: crisis ? '#D85A30' : '#378ADD',
    headCol: T.words ? (crisis ? '#A32D2D' : '#185FA5') : '#1A1A1A',
    foot: (T.context ? 'No source. No wages. ' : 'Illustrative data. ') + `Axis ${money(lo)}–${money(hi)} · ${2015 + w[0]}–${2015 + w[1]}`,
  };
}

export function mkView(s: MkS) {
  const M = mkModel(s);
  const desc: Record<TrickKey, string> = M.crisis
    ? { crop: 'Start the axis just under the data', cherry: 'Show only 2021–2025', frame: 'Lead with the scary percentage', context: 'Hide wages and the source', words: 'Use alarming words' }
    : { crop: 'Stretch the axis far above the data', cherry: 'Show only 2015–2020', frame: 'Shrink it to dollars per day', context: 'Hide wages and the source', words: 'Use soothing words' };
  const meterCol = M.score <= 20 ? '#9FE0B8' : M.score <= 60 ? '#FFB08A' : '#E24B4A';
  return {
    goals: ([['crisis', 'Sell a crisis', '#D85A30'], ['calm', 'Sell calm', '#9CD3F0']] as const)
      .map(([k, l, c]) => `<button type="button" data-act="goal" data-arg="${k}" aria-pressed="${s.goal === k}" class="goal${s.goal === k ? ' on' : ''}" style="--c:${c}">${l}</button>`)
      .join(''),
    tricks: TRICK_KEYS.map((k) => {
      const on = s.tricks[k];
      return `<button type="button" data-act="trick" data-arg="${k}" aria-pressed="${on}" class="tk${on ? ' on' : ''}"><span><strong>${on ? '✓ ' : ''}${NAMES[k]}</strong><br><span class="d">${desc[k]}</span></span><span class="pts">+20</span></button>`;
    }).join(''),
    meterArc: `<path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="${meterCol}" stroke-width="16" stroke-linecap="round" stroke-dasharray="251.3" stroke-dashoffset="${(251.3 * (1 - M.score / 100)).toFixed(1)}" class="arc"/>`,
    score: String(M.score),
    meterLabel: `Spin meter at ${M.score} out of 100`,
    verdict: `<span class="v" style="color:${meterCol}">${VERDICTS[M.score / 20]}</span><span class="vn">${
      M.score ? 'Same rent data as the honest chart, and every number on yours is still technically true.' : 'Nothing spun yet. Pick a story, then stack some tricks.'
    }</span>`,
    headline: `<span class="${pop()}" style="color:${M.headCol}">${esc(M.head)}</span>`,
    axis: `<span>${money(M.hi)}</span><span>${money(M.lo)}</span>`,
    bars: M.bars.map((b) => `<span class="bar" style="height:${b.h.toFixed(1)}%;background:${M.barCol};opacity:${b.op}"></span>`).join(''),
    foot: esc(M.foot),
  };
}
export const honestBars = rentS.map((v) => ((v / 1800) * 100).toFixed(1));

// ------------------------------------------------------------- 6 · Surveys
const rg = (seed: number) => { const f = rngF(seed); return () => f() + 0.5; };
const shuffle = <T,>(a: T[], rr: () => number) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rr() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
type Dot = { x: string; y: string; yes: boolean; zone: string };
const DOTS: Dot[] = (() => {
  const R = rg(2026);
  const inZone = (x: number, y: number, m: number) => (x > 24 - m && x < 204 + m && y > 24 - m && y < 152 + m) || (x > 436 - m && x < 616 + m && y > 208 - m && y < 336 + m);
  const out: Dot[] = [];
  const group = (count: number, yesCount: number, zone: string) => {
    const flags = shuffle(Array.from({ length: count }, (_, i) => i < yesCount), R);
    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      if (zone === 'station') { x = 40 + R() * 150; y = 56 + R() * 86; }
      else if (zone === 'mall') { x = 450 + R() * 150; y = 220 + R() * 90; }
      else { do { x = 14 + R() * 612; y = 14 + R() * 332; } while (inZone(x, y, 10)); }
      out.push({ x: x.toFixed(1), y: y.toFixed(1), yes: flags[i], zone });
      R(); R(); // keep the random sequence identical to the mockup's
    }
  };
  group(30, 24, 'station'); group(40, 1, 'mall'); group(130, 5, 'city');
  return out;
})();
const zoneIdx = (z: string) => DOTS.map((d, i) => (d.zone === z ? i : -1)).filter((i) => i >= 0);
const SAMPLES: Record<string, number[]> = { station: zoneIdx('station').slice(0, 25), mall: zoneIdx('mall').slice(0, 25), random: shuffle(DOTS.map((_, i) => i), rg(3)).slice(0, 25) };
const SPOTS = [['station', 'Outside a C-Train station', '#FF7A3D'], ['mall', 'In a mall parking lot', '#ED93B1'], ['random', 'Random sample of the city', '#9FE0B8']] as const;
const INFO: Record<string, { head: string; fine: string; lesson: string }> = {
  station: { head: '3 in 4 Calgarians take transit to work, new survey finds', fine: '25 people interviewed outside one C-Train station at 8 a.m.', lesson: 'Everyone at a train station already rides the train. You surveyed the answer before asking the question.' },
  mall: { head: 'Almost nobody in Calgary takes transit, survey shows', fine: '25 people interviewed in a suburban mall parking lot.', lesson: 'People in a parking lot drove there. The place you stand picks your answer for you.' },
  random: { head: 'About 1 in 6 Calgarians commute by transit', fine: '25 people chosen at random from across the whole city.', lesson: 'A random sample gives everyone the same chance of being asked. Small samples still wobble, but they don’t lean one way.' },
};
export type SvS = { poll: string | null; reveal: boolean; fine: boolean };
export const svInit: SvS = { poll: null, reveal: false, fine: false };
const TRUTH = Math.round((DOTS.filter((d) => d.yes).length / DOTS.length) * 100);

export function svView(s: SvS) {
  const sample = s.poll ? SAMPLES[s.poll] : null;
  const inS = sample ? new Set(sample) : null;
  const yes = sample ? sample.filter((i) => DOTS[i].yes).length : 0;
  const pct = sample ? Math.round((yes / sample.length) * 100) : 0;
  const cur = s.poll ? INFO[s.poll] : { head: 'Pick a place to run your survey', fine: 'Not run yet.', lesson: 'Each dot is one person. Orange dots take transit; you won’t know who until you ask.' };
  const gap = Math.abs(pct - TRUTH);
  const resCol = !s.poll ? '#4A7176' : gap <= 6 ? '#9FE0B8' : gap <= 20 ? '#FFB08A' : '#E24B4A';
  const shadow = s.poll ? SPOTS.find((p) => p[0] === s.poll)![2] : '#4A7176';
  const p = pop();
  return {
    spots: SPOTS.map(([k, l, c]) => `<button type="button" data-act="poll" data-arg="${k}" aria-pressed="${s.poll === k}" class="spot${s.poll === k ? ' on' : ''}" style="--c:${c}">${l}</button>`).join(''),
    reveal: `<button type="button" data-act="reveal" aria-pressed="${s.reveal}" class="reveal${s.reveal ? ' on' : ''}">${s.reveal ? 'Hide the truth' : 'Reveal the whole city'}</button>`,
    zones:
      `<rect x="24" y="24" width="180" height="128" rx="14" fill="${s.poll === 'station' ? '#FF7A3D26' : '#FF7A3D0D'}" stroke="#FF7A3D" stroke-width="${s.poll === 'station' ? 2.5 : 1}" stroke-dasharray="6 5" class="zone"/>` +
      `<rect x="436" y="208" width="180" height="128" rx="14" fill="${s.poll === 'mall' ? '#ED93B126' : '#ED93B10D'}" stroke="#ED93B1" stroke-width="${s.poll === 'mall' ? 2.5 : 1}" stroke-dasharray="6 5" class="zone"/>`,
    // 8 groups that wander out of step (cheaper than animating 200 dots one by one).
    dots: Array.from({ length: 8 }, (_, g) =>
      `<g class="wander" style="animation-duration:${(4 + g * 0.55).toFixed(2)}s;animation-delay:-${(g * 0.8).toFixed(1)}s">` +
      DOTS.map((d, i) => {
        if (i % 8 !== g) return '';
        const asked = !!(inS && inS.has(i));
        const show = s.reveal || asked;
        const fill = show ? (d.yes ? '#FF7A3D' : '#9CD3F0') : '#4A7176';
        const op = s.poll && !asked && !s.reveal ? 0.28 : 1;
        return `<circle cx="${d.x}" cy="${d.y}" r="${asked ? 6.5 : 4.5}" style="fill:${fill};opacity:${op}"/>`;
      }).join('') +
      '</g>',
    ).join(''),
    fieldLabel: esc(`Crowd of 200 people${s.poll ? `; 25 surveyed, ${pct}% take transit` : ''}; true share ${TRUTH}%`),
    shadow: `--shadow:${shadow}`,
    report:
      `<p class="kick">SURVEY REPORT · FICTIONAL</p><p class="head ${p}">${esc(cur.head)}</p>` +
      `<p class="fine${s.fine ? ' big' : ''}">Fine print: ${esc(cur.fine)}</p>` +
      `<button type="button" data-act="fine" class="finebtn">${s.fine ? 'Shrink it back' : 'Read the fine print'}</button>`,
    result:
      `<div class="row"><span>Your sample</span><span class="mono" style="color:${resCol};font-weight:600">${s.poll ? pct + '% take transit' : 'not run yet'}</span></div>` +
      `<div class="track"><span class="fill" style="width:${s.poll ? Math.max(2, pct) : 0}%;background:${resCol}"></span><span class="truth" aria-hidden="true" style="left:${TRUTH}%"></span></div>` +
      `<div class="scale"><span>0%</span><span style="color:#E8D44D">▲ truth ${TRUTH}%</span><span>100%</span></div>`,
    gap: `<span class="${p}" style="color:${resCol}">${!s.poll ? 'Run a survey to compare.' : gap <= 6 ? `Within ${gap} ${gap === 1 ? 'point' : 'points'} of the truth. Fair sample.` : `Off by ${gap} points, from the same city.`}</span>`,
    lesson: esc(cur.lesson),
    truth: `${TRUTH}%`,
  };
}

// ---------------------------------------------------------- 7 · Spot it
const OPTS = ['The y-axis is cropped', 'The time window is cherry-picked', 'The base is tiny, so the percentage is huge', 'It should be per person'];
const CORRECT = 2;
export type QuizS = { pick: number | null };
export const quizInit: QuizS = { pick: null };
export function quizView(s: QuizS) {
  const answered = s.pick !== null;
  return {
    opts: OPTS.map((o, i) => {
      const right = answered && i === CORRECT;
      const wrong = s.pick === i && i !== CORRECT;
      const cls = right ? ' right' : wrong ? ' wrong' : '';
      return `<button type="button" data-act="pick" data-arg="${i}" ${right || wrong ? 'aria-pressed="true"' : ''} class="q${cls}">${right ? '✓ ' : wrong ? '✕ ' : ''}${esc(o)}</button>`;
    }).join(''),
    feedback: answered
      ? `<div role="status" class="fb rise"><p style="font-weight:600;color:${s.pick === CORRECT ? '#9FE0B8' : '#FFB08A'}">${s.pick === CORRECT ? 'Exactly right.' : 'Close, but not this one.'}</p><p class="muted">Going from 2 to 8 is +300%, but it's 6 extra incidents on one street. With a base this small, percentages make random noise look like a trend. The honest version: “6 more break-ins than last year; too few to call a trend.”</p></div>`
      : '',
  };
}

// --------------------------------------------------------------- Progress
export const LESSONS = [
  { key: 'l1', id: 'tricks', name: 'Four tricks', color: '#FF7A3D' },
  { key: 'l2', id: 'l2', name: 'Two newsrooms', color: '#E24B4A' },
  { key: 'l3', id: 'l3', name: 'Average vs median', color: '#FFB08A' },
  { key: 'l4', id: 'l4', name: 'Correlation', color: '#9CD3F0' },
  { key: 'l5', id: 'l5', name: 'Make it misleading', color: '#ED93B1' },
  { key: 'l6', id: 'l6', name: 'Biased surveys', color: '#9FE0B8' },
  { key: 'l7', id: 'l7', name: 'Spot the trick', color: '#E8D44D' },
];
