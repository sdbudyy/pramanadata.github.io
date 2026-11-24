// The "Clean dataset" download: built from the same study file as the page,
// so the CSV and the charts can never disagree.
import type { APIRoute } from 'astro';
import { allStudies, type Study } from '../../../lib/studies';

export async function getStaticPaths() {
  const studies = await allStudies();
  return studies.map((study) => ({ params: { slug: study.id }, props: { study } }));
}

const cell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const GET: APIRoute = ({ props }) => {
  const { study } = props as { study: Study };
  const c = study.data.chart;
  const status = study.data.placeholder ? 'SAMPLE - invented for layout testing, not real data' : 'published';
  const rows: (string | number)[][] = [['view', 'year', 'series', 'value', 'unit', 'status']];
  for (const v of c.views) {
    if (v.type === 'line') {
      c.years.forEach((y, i) => {
        rows.push([v.label, y, c.aLabel, v.a[i], c.unit, status]);
        rows.push([v.label, y, c.bLabel, v.b[i], c.unit, status]);
      });
    } else {
      for (const b of v.bars) rows.push([v.label, '', b.label, b.value, v.unit.trim(), status]);
    }
  }
  const body = rows.map((r) => r.map(cell).join(',')).join('\n') + '\n';
  return new Response(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
};
