// Tiny view layer for the Learn lessons. Each lesson has a state object and a
// view(state) function that returns HTML strings for named slots. The page is
// rendered once at build time with the starting state (so it reads fine before
// scripts load), then the browser re-runs view() on every interaction and
// "morphs" the DOM in place, so CSS transitions on bars and lines still play.

export const esc = (s: string | number) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Update `el`'s children to match `html`, reusing nodes where the tag matches. */
export function morph(el: Element, html: string) {
  const tpl = document.createElement('template');
  const isSvg = el instanceof SVGElement;
  if (isSvg) {
    tpl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${html}</svg>`;
    patchChildren(el, tpl.content.firstElementChild!);
  } else {
    tpl.innerHTML = html;
    patchChildren(el, tpl.content);
  }
}

function patchChildren(from: Node, to: Node) {
  const a = Array.from(from.childNodes);
  const b = Array.from(to.childNodes);
  b.forEach((nb, i) => {
    const na = a[i];
    if (!na) {
      from.appendChild(nb);
      return;
    }
    if (na.nodeType !== nb.nodeType || (na as Element).tagName !== (nb as Element).tagName) {
      from.replaceChild(nb, na);
      return;
    }
    if (na.nodeType === Node.TEXT_NODE) {
      if (na.textContent !== nb.textContent) na.textContent = nb.textContent;
      return;
    }
    const ea = na as Element, eb = nb as Element;
    // A class change restarts CSS animations (used for the "pop" on new text).
    for (const { name, value } of Array.from(eb.attributes)) if (ea.getAttribute(name) !== value) ea.setAttribute(name, value);
    for (const { name } of Array.from(ea.attributes)) if (!eb.hasAttribute(name)) ea.removeAttribute(name);
    patchChildren(ea, eb);
  });
  for (let i = a.length - 1; i >= b.length; i--) from.removeChild(a[i]);
}

export type Act<S> = (s: S, name: string, arg: string, el: HTMLElement) => Partial<S> | null | void;

/**
 * Wire a lesson: slots are elements with data-slot="name"; controls carry
 * data-act="name" (and optional data-arg). Clicks and input events call act().
 */
export function mount<S extends object>(
  root: HTMLElement,
  initial: S,
  view: (s: S) => Record<string, string>,
  act: Act<S>,
  after?: (s: S, v: Record<string, string>) => void,
) {
  let state = initial;
  const slots = Array.from(root.querySelectorAll<HTMLElement>('[data-slot]'));
  const render = () => {
    const v = view(state);
    for (const el of slots) {
      const k = el.dataset.slot!;
      if (k in v) morph(el, v[k]);
    }
    after?.(state, v);
  };
  const handle = (e: Event) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!el || !root.contains(el)) return;
    if (e.type === 'click' && (el instanceof HTMLInputElement)) return;
    const patch = act(state, el.dataset.act!, el.dataset.arg ?? '', el);
    if (patch) {
      state = { ...state, ...patch };
      render();
    }
  };
  root.addEventListener('click', handle);
  root.addEventListener('input', handle);
  render();
  return { get: () => state, set: (p: Partial<S>) => ((state = { ...state, ...p }), render()) };
}

/** Record a finished lesson (progress is kept in this browser only). */
export function markDone(id: string) {
  document.dispatchEvent(new CustomEvent('lesson-done', { detail: id }));
}

/** Flip between two class names so a "pop" animation replays on each change. */
let flip = false;
export const pop = () => ((flip = !flip), flip ? 'popA' : 'popB');

export const ACCENT = '#FF7A3D';
