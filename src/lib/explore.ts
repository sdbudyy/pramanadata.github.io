// Recalculates the explorer for a chosen start year. Shared by the build and
// the browser, so the first render and every later one use the same maths.
import type { ChartData, LineView } from './chart';

export type ExploreConfig = {
  years: number[];
  a: number[];
  b: number[];
  studyStart: number;
  aShort: string;
  bShort: string;
  aLabel: string;
  bLabel: string;
};

const sign = (v: number) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1);

export function explore(cfg: ExploreConfig, start: number) {
  const i0 = Math.max(0, cfg.years.indexOf(start));
  const years = cfg.years.slice(i0).map(String);
  const ai = cfg.a.slice(i0).map((v) => (v / cfg.a[i0]) * 100);
  const bi = cfg.b.slice(i0).map((v) => (v / cfg.b[i0]) * 100);
  const all = ai.concat(bi);
  // Axis: round outward to the nearest 5. It does not start at zero, and the page says so.
  const lo = Math.floor((Math.min(...all) - 2) / 5) * 5;
  const hi = Math.ceil((Math.max(...all) + 2) / 5) * 5;
  const ag = ai[ai.length - 1] - 100;
  const bg = bi[bi.length - 1] - 100;
  const gap = ag - bg;

  const view: LineView = {
    type: 'line',
    id: 'explore',
    label: 'Explore',
    a: ai.map((v) => Math.round(v * 10) / 10),
    b: bi.map((v) => Math.round(v * 10) / 10),
    yMin: lo,
    yMax: hi,
    // Label 100 (the start) only when it is not crowding the end labels.
    yTicks: [lo, ...((100 - lo) / (hi - lo) > 0.15 && (hi - 100) / (hi - lo) > 0.15 ? [100] : []), hi],
  };
  const chart: ChartData = { years, aShort: cfg.aShort, bShort: cfg.bShort };

  return {
    view,
    chart,
    gapLabel: `${sign(gap)} pts`,
    aLabel: `${sign(ag)}%`,
    bLabel: `${sign(bg)}%`,
    verdict: gap > 0 ? `Yes, ${cfg.aShort.toLowerCase()} still leads` : 'No, the gap flips',
    label: `${cfg.aLabel} and ${cfg.bLabel.toLowerCase()} indexed to ${start} = 100; gap ${sign(gap)} points by ${years[years.length - 1]}.`,
  };
}
