# Pramana

Calgary, Alberta and Canada, in data. No spin.

Source for [pramanadata.ca](https://pramanadata.ca), built with [Astro](https://astro.build).

## Run it locally

```sh
npm install
npm run dev      # http://localhost:4321/pramanadata.github.io/
npm run build    # static site in dist/
```

## Deploying

Every merge to `main` builds and publishes to GitHub Pages via `.github/workflows/deploy.yml`.

- **Comment box key:** add a repository secret `PUBLIC_WEB3FORMS_KEY` (Settings → Secrets and variables → Actions). It holds the form service key only; the destination email lives in the form service, never in this repo. Without it, the box shows "opens soon".
- **Custom domain / Vercel:** set repository variables `SITE_URL=https://pramanadata.ca` and `SITE_BASE=/`. On Vercel, set the same two as environment variables.

## Layout

- `src/site.config.ts` – name, X handle, menu
- `src/styles/tokens.css` – colours, fonts, spacing
- `src/components/` – Logo, Header, Footer, CommentBox
- `src/pages/styleguide.astro` – internal reference for the design foundations (not linked, not indexed)
