# Pramana — project guide for Claude Code

Pramana (formal name **Pramana Data**) is Shaurya Dave's data and engineering site: neutral, transparent
studies on Calgary, Alberta and Canada, plus engineering builds (Arduino, data models). Sanskrit
*pramāṇa* = proof, a valid means of knowing. Domain: **pramanadata.ca**. X: **@pramanadata**.

**Mission: data with no lies or bias.** Every study shows its sources, rates how far to trust them,
states what it can't show, and logs corrections. When in doubt, choose the more honest presentation
(axis from zero, full time range, medians alongside averages, uncertainty shown).

## How we work

- **Claude writes the code; Shaurya reviews.** One pull request per stage. Never commit to `main`.
- Branch names: `stage-N-short-name`. Small, readable commits.
- Before opening a PR: `npm run build` must pass; check the page at desktop (1440) and phone (390) widths.
- Never put an email address, API secret or personal data in the repo. The comment-box key comes from
  the `PUBLIC_WEB3FORMS_KEY` build secret (a form key, not an address).
- Placeholder content must be visibly labelled (e.g. "SAMPLE DATA", "Placeholder study"). Never present
  invented numbers as findings.
- Canadian English (colour, centre, licence as a noun).

## Stack

- Astro (static), deployed to GitHub Pages by `.github/workflows/deploy.yml` on merge to `main`.
- Current URL base: `/pramanadata.github.io`. Always build links with `url()` from `src/lib/url.ts`.
  Custom domain / Vercel later: set `SITE_URL` and `SITE_BASE=/` (see README).
- Plain CSS with tokens in `src/styles/tokens.css`. Small scripts only; interactive pieces become Astro
  islands. No heavy chart libraries: charts are hand-made SVG.

## Design rules (theme V1)

- Colours: page `#10282B`, panels `#0C2124`, raised `#173538`, lines `#24474A`/`#2F5659`,
  control borders `#4A7176`, text `#ECE6D6` / `#B3C2BB` / `#8FA6A0`, accent `#FF7A3D`, links `#FF9A66`,
  confident `#9FE0B8` on `#1E3F35`, caution `#FFB08A` on `#33261B`, second series `#9CD3F0`.
- Type: IBM Plex Mono 600 for headings, labels and numbers; IBM Plex Sans 400/600 for body. Self-hosted.
- Subtle 40 px grid background on hero sections. Rounded panels (12–16 px). Dashboard feel.
- Logo: the **confidence ellipse** (tilted −35°, centre dot). `src/components/Logo.astro`; the thicker
  small-size cut is used below 32 px. Spec and files in `design/brand/`. White or petrol only, never orange.
- Charts: start at zero unless clearly marked; label units and sources under every chart; colour pairs
  differ in lightness too (orange vs light blue), not hue alone.

## Mobile (a priority)

Most visitors arrive from X on a phone. Mobile must be **smooth and fast** and **differ from desktop as
little as possible**: same sections, order and content, only the layout adapts.

- First screen answers the question: title, one-line answer, headline number, all above the fold.
- Hover interactions become tap/drag. Touch targets ≥ 44 px. Inputs 16 px (no iOS zoom).
- Wide tables become stacked cards; long detail (method steps, source scores) collapses, first item open.
- Key controls in interactive lessons stick to the top while their result scrolls.
- Speed budget: readable first screen < 1.5 s on 4G; ~150 KB before charts; animate only
  `transform`/`opacity`; lazy-load interactive islands; honour `prefers-reduced-motion`.

## Site map and decisions

Menu: **Studies · Builds · Learn · Sandbox · About**, plus a **Follow on X** button.

- **Home** — dashboard style with the latest finding's chart as the hero (mockup: `LayoutHomeA`).
- **Studies** — index of all studies (to design), and the study page template (mockups: `StudyPage`,
  `StudyExplorer`, mobile: `StudyMobile`, `StudyFromX`). Study page sections, in order: breadcrumb and
  meta → title → one-sentence answer → headline numbers → main chart with view tabs → What I found →
  What this doesn't show → more figures → Method (datasets, steps, assumptions) → Source check (1–5 on
  authority, method published, recency, fit to question, independence; ≥4.0 high confidence, 3.0–3.9 use
  with care, <3.0 weak) → Files (clean CSV, notebook, code) → Share and discuss (private comment box +
  Discuss on X) with revision log → Related studies → citation.
- **Builds** — engineering projects, each with a running progress log (to design).
- **Learn** — "Same numbers. Two stories." Seven interactive lessons with progress tracking and
  confetti on completion: four tricks, two newsrooms, average vs median, correlation isn't causation,
  make it misleading, biased surveys, spot the trick (mockups: `Learn`, `LearnMobile`).
- **Sandbox** — system-dynamics model builder. **Ships later**; at launch the page says "coming soon"
  (prototype mockup: `Sandbox`).
- **About** — how the data and simulations are found and built first (transparency), then a short
  "who I am" (mockup: `About`). Include a one-line conflict-of-interest disclosure.
- **No newsletter.** All "Subscribe" calls to action become "Follow on X".
- Progress logs live on the site only; X gets final findings with a chart and a link.
- Private comment box: Web3Forms, posted from the page; comments are not published.

## Build stages

1. Setup and design foundations — **done (PR #1)**
2. Study page template + 2 placeholder studies — **done (PR #2)**. Studies are YAML in `src/content/studies/`.
3. Homepage — **done (PR #3)**. Builds are YAML in `src/content/builds/`.
4. Learn (port the seven lessons; fix known mobile bugs) — **done (PRs #4, #5)**
5. About — **done (PR #6)**. Still needs Shaurya's photo and disclosure line.
6. Studies index, Builds page and log, Sandbox "coming soon" polish, 404 — **in review**
7. Per-study X link-preview images, speed and accessibility pass

## Design references

`design/mockups/*.dc.html` are the approved mockups, exported from the design canvas. They are source for
a canvas runtime, so they won't render on their own in a browser: read them as markup and CSS (inline
styles hold the exact sizes and colours) and the `class Component` script at the bottom (it holds the
interactive logic and copy for Learn, Sandbox and About). `{{ }}` are template holes filled by that script.
The live canvas (owner-only link) is https://claude.ai/artifact/1FoekS6e46WSCCsnvZAEKC — ask Shaurya for
a screenshot if a layout is unclear.

## Still open

- Real study topics (placeholders for now) and the source-rating rubric, corrections policy and
  methods template write-ups.
- Trademark check on "Pramana"; claim handles; analytics (privacy-friendly) and a privacy policy.
