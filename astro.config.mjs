// @ts-check
import { defineConfig } from 'astro/config';

// While the site lives at sdbudyy.github.io/pramanadata.github.io, every URL
// needs that prefix. When the custom domain (or Vercel) takes over, set
// SITE_URL to the domain and SITE_BASE to "/" — no other change needed.
const site = process.env.SITE_URL || 'https://sdbudyy.github.io';
const base = process.env.SITE_BASE || '/pramanadata.github.io';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'auto' },
});
