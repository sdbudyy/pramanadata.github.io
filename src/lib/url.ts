// Prefix a site-relative path with the deploy base, so links work both on
// GitHub Pages (/pramanadata.github.io/...) and on a custom domain (/...).
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\//, '');
  return clean ? `${base}/${clean}` : `${base}/`;
}

// True when `path` is the current page or a section the current page sits in.
export function isActive(current: string, path: string): boolean {
  const target = url(path).replace(/\/$/, '');
  const here = current.replace(/\/$/, '');
  return here === target || here.startsWith(target + '/');
}
