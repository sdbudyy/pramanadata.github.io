// One place for site-wide facts. Nothing private goes in here: this file is public.
export const SITE = {
  name: 'Pramana',
  legalName: 'Pramana Data',
  author: 'Shaurya Dave',
  city: 'Calgary, AB',
  tagline: 'Calgary, Alberta and Canada, in data. No spin.',
  description:
    'Neutral, transparent data studies on Calgary, Alberta and Canada, with every source, method and limitation shown.',
  xHandle: 'pramanadata',
  get xUrl() {
    return `https://x.com/${this.xHandle}`;
  },
};

export type NavItem = { label: string; href: string; soon?: boolean };

export const NAV: NavItem[] = [
  { label: 'Studies', href: 'studies/' },
  { label: 'Builds', href: 'builds/' },
  { label: 'Learn', href: 'learn/' },
  { label: 'Sandbox', href: 'sandbox/', soon: true },
  { label: 'About', href: 'about/' },
];
