// Single source of truth for same-page anchor landing positions.
// Two handlers drive anchor clicks (ScrollMotion in the capture phase, the
// header as fallback), so this math must live here — never duplicated.

// Per-section fine-tuning, measured in px (positive = scroll further down).
export const SECTION_SCROLL_EXTRA: Record<string, number> = { solutions: 108, approach: 89, life: 820 };

export function getNavbarHeight(): number {
  const nav = document.querySelector('.hn-shell');
  return nav ? Math.ceil(nav.getBoundingClientRect().height) : 89;
}

// Lands `id` below the sticky navbar. Callers must preventDefault first.
export function scrollToSection(id: string, extra = 0): void {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({
    top: el.getBoundingClientRect().top + window.scrollY - getNavbarHeight() - 26 + (SECTION_SCROLL_EXTRA[id] ?? 0) + extra,
    behavior: reduce ? 'auto' : 'smooth',
  });
}

// Entry-point adjustment: the hero "A better way starts here" link lands 0.5px
// below the shared #solutions calibration (nav button unaffected).
export function entryBonus(id: string, anchor: HTMLAnchorElement | null): number {
  if (id === 'solutions' && anchor?.closest('.hp-hero-bottom')) return 0.5;
  return 0;
}
