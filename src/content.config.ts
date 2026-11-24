// Content collections. Each study is one YAML file in src/content/studies/.
// The file name (without .yaml) becomes the URL: /studies/<file-name>/.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const num = z.number();

// One headline tile. `kind: headline` is the orange lead tile; `text` shows a word, not a number.
const tile = z.object({
  label: z.string(),
  value: z.string(),
  note: z.string(),
  kind: z.enum(['headline', 'number', 'text']).default('number'),
});

// A view of the main chart: two lines over the years, or a ranked bar list.
const lineView = z.object({
  type: z.literal('line'),
  id: z.string(),
  label: z.string(),
  short: z.string().optional(), // shorter tab label for phones
  a: z.array(num), // first series (orange, solid)
  b: z.array(num), // second series (light blue, dashed)
  yMin: num, // bottom of the axis (state it honestly; shown under the chart when not 0)
  yMax: num,
  yTicks: z.array(num),
  notes: z.array(z.string()).optional(), // one line per year, shown when that year is tapped
});
const barView = z.object({
  type: z.literal('bars'),
  id: z.string(),
  label: z.string(),
  short: z.string().optional(),
  unit: z.string().default(''),
  bars: z.array(z.object({ label: z.string(), value: num })),
  caption: z.string().optional(),
});

const figure = z.object({
  caption: z.string(),
  type: z.enum(['hbars', 'vbars']),
  unit: z.string().default(''),
  bars: z.array(z.object({ label: z.string(), value: num })),
  refLine: z.object({ value: num, label: z.string() }).optional(),
  source: z.string(),
});

const scores = z.object({
  authority: z.number().int().min(1).max(5),
  method: z.number().int().min(1).max(5),
  recency: z.number().int().min(1).max(5),
  fit: z.number().int().min(1).max(5),
  independence: z.number().int().min(1).max(5),
});

const studies = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/studies' }),
  schema: z.object({
    number: z.number().int(),
    title: z.string(),
    topic: z.string(),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    readMinutes: z.number().int(),
    // Placeholder studies carry SAMPLE DATA labels everywhere and are hidden from search engines.
    placeholder: z.boolean().default(false),
    answer: z.string(),
    shareText: z.string().optional(),
    tiles: z.array(tile).min(1).max(4),

    chart: z.object({
      caption: z.string(),
      years: z.array(z.string()),
      aLabel: z.string(),
      aShort: z.string(),
      bLabel: z.string(),
      bShort: z.string(),
      unit: z.string(), // e.g. "index, 2020 = 100"
      annotation: z.object({ index: z.number().int(), title: z.coerce.string(), text: z.string() }).optional(),
      views: z.array(z.discriminatedUnion('type', [lineView, barView])).min(1),
      source: z.string(),
      sourceShort: z.string().optional(),
    }),

    findings: z.array(z.string()).min(1),
    caveat: z.string(),
    figures: z.array(figure).default([]),

    explorer: z
      .object({
        question: z.string(),
        years: z.array(z.number().int()),
        a: z.array(num),
        b: z.array(num),
        studyStart: z.number().int(),
        picks: z.array(z.number().int()),
        gapLabel: z.string(),
      })
      .optional(),

    datasets: z.array(
      z.object({
        name: z.string(),
        publisher: z.string(),
        years: z.string(),
        licence: z.string(),
        url: z.string().url(),
      }),
    ),
    steps: z.array(z.string()),
    assumptions: z.array(z.string()),

    sources: z.array(
      z.object({
        name: z.string(),
        publisher: z.string(),
        kind: z.string(),
        scores,
        note: z.string(),
      }),
    ),

    files: z
      .object({
        notebook: z.string().url().optional(),
        repo: z.string().url().optional(),
      })
      .default({}),

    revisions: z.array(z.object({ version: z.string(), date: z.coerce.date(), text: z.string() })),
  }),
});

// Engineering builds. Each has a stage and a dated progress log (newest first).
const builds = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/builds' }),
  schema: z.object({
    name: z.string(),
    kind: z.string(), // e.g. "Arduino", "Data model"
    summary: z.string(),
    stage: z.enum(['idea', 'build', 'test', 'result']),
    updated: z.coerce.date(),
    placeholder: z.boolean().default(false),
    photoAlt: z.string().optional(),
    result: z.string().optional(), // the final finding, once stage is "result"
    log: z.array(z.object({ date: z.coerce.date(), text: z.string() })).min(1),
  }),
});

export const collections = { studies, builds };
