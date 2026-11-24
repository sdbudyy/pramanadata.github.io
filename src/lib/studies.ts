import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE } from '../site.config';

export type Study = CollectionEntry<'studies'>;
export type Scores = Study['data']['sources'][number]['scores'];

export const CRITERIA: { key: keyof Scores; label: string }[] = [
  { key: 'authority', label: 'Authority' },
  { key: 'method', label: 'Method published' },
  { key: 'recency', label: 'Recency' },
  { key: 'fit', label: 'Fit to question' },
  { key: 'independence', label: 'Independence' },
];

/** All studies, newest first (ties broken by study number). */
export async function allStudies() {
  const list = await getCollection('studies');
  return list.sort(
    (a, b) => b.data.published.getTime() - a.data.published.getTime() || b.data.number - a.data.number,
  );
}

export const studyNo = (n: number) => `Study ${String(n).padStart(3, '0')}`;

/** Average of the five criteria, one decimal. */
export function overall(s: Scores) {
  const v = CRITERIA.reduce((sum, c) => sum + s[c.key], 0) / CRITERIA.length;
  return Math.round(v * 10) / 10;
}

/** Rubric: ≥4.0 high confidence · 3.0–3.9 use with care · <3.0 weak. */
export function confidence(score: number) {
  if (score >= 4) return { label: 'High confidence', tone: 'ok' as const };
  if (score >= 3) return { label: 'Use with care', tone: 'warn' as const };
  return { label: 'Weak · flagged', tone: 'weak' as const };
}

const dateFmt = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
export const fmtDate = (d: Date) => dateFmt.format(d);

/** Other studies, same topic first, up to three. */
export function related(current: Study, all: Study[]) {
  const others = all.filter((s) => s.id !== current.id);
  const same = others.filter((s) => s.data.topic === current.data.topic);
  const rest = others.filter((s) => s.data.topic !== current.data.topic);
  return [...same, ...rest].slice(0, 3);
}

export function citation(study: Study, pageUrl: string) {
  const year = study.data.published.getUTCFullYear();
  const t = study.data.title;
  const title = /[.?!]$/.test(t) ? t : `${t}.`;
  return `Dave, S. (${year}). ${title} ${SITE.legalName}. ${pageUrl}`;
}

/** The lead tile's value, used as the "key number" on related-study cards. */
export const keyNumber = (s: Study) => s.data.tiles[0]?.value ?? '';
