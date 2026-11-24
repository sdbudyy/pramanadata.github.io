import { getCollection, type CollectionEntry } from 'astro:content';
import { allStudies, studyNo } from './studies';

export type Build = CollectionEntry<'builds'>;

export const STAGES = ['idea', 'build', 'test', 'result'] as const;
export const STAGE_LABEL = { idea: 'Idea', build: 'Build', test: 'Test', result: 'Result' } as const;

/** All builds, most recently updated first. */
export async function allBuilds() {
  const list = await getCollection('builds');
  return list.sort((a, b) => b.data.updated.getTime() - a.data.updated.getTime());
}

export type NoteEntry = { date: Date; source: string; text: string; placeholder: boolean };

/** The notebook: every build log entry and study revision, newest first. */
export async function notebook(limit = 3): Promise<NoteEntry[]> {
  const [builds, studies] = await Promise.all([allBuilds(), allStudies()]);
  const notes: NoteEntry[] = [
    ...builds.flatMap((b) =>
      b.data.log.map((l) => ({ date: l.date, source: b.data.name, text: l.text, placeholder: b.data.placeholder })),
    ),
    ...studies.flatMap((s) =>
      s.data.revisions.map((r) => ({
        date: r.date,
        source: studyNo(s.data.number),
        text: `${r.version}: ${r.text}`,
        placeholder: s.data.placeholder,
      })),
    ),
  ];
  return notes.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
}
