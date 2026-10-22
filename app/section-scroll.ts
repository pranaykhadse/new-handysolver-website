// Single source of truth for same-page anchor landing positions.
// Two handlers drive anchor clicks (ScrollMotion in the capture phase, the
// header as fallback), so this math must live here — never duplicated.

// Per-section fine-tuning, measured in px (positive = scroll further down).
export const SECTION_SCROLL_EXTRA: Record<string, number> = { life: 820 };

// These sections land by their own content: the first line of content sits just below the sticky navbar,
// whatever the screen size (section padding and navbar height both change between phone, tablet and desktop).
const CONTENT_ALIGNED = new Set(['solutions', 'approach']);
const CONTENT_GAP = 14;

export function getNavbarHeight(): number {
  const nav = document.querySelector('.hn-shell');
  return nav ? Math.ceil(nav.getBoundingClientRect().height) : 89;
}

function targetTop(id: string, extra: number): number | null {
  const el = document.getElementById(id);
  if (!el) return null;
  const sectionTop = el.getBoundingClientRect().top + window.scrollY;
  return CONTENT_ALIGNED.has(id)
    ? sectionTop + (parseFloat(getComputedStyle(el).paddingTop) || 0) - getNavbarHeight() - CONTENT_GAP + extra
    : sectionTop - getNavbarHeight() - 26 + (SECTION_SCROLL_EXTRA[id] ?? 0) + extra;
}

// Lands `id` below the sticky navbar. Callers must preventDefault first.
// Content above the section can change height while the page is scrolling (images, the testimonial carousel),
// so once the scroll comes to rest the target is measured again and corrected if it moved.
export function scrollToSection(id: string, extra = 0): void {
  const first = targetTop(id, extra);
  if (first === null) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: first, behavior: reduce ? 'auto' : 'smooth' });

  const started = performance.now();
  let last = window.scrollY;
  let restingSince = started;
  let corrections = 0;
  let cancelled = false;
  const cancel = () => { cancelled = true; };
  window.addEventListener('wheel', cancel, { passive: true, once: true });
  window.addEventListener('touchstart', cancel, { passive: true, once: true });
  window.addEventListener('keydown', cancel, { once: true });
  const tick = () => {
    if (cancelled || performance.now() - started > 6000) return;
    const now = performance.now();
    if (Math.abs(window.scrollY - last) > 0.5) {
      last = window.scrollY;
      restingSince = now;
    } else if (now - restingSince > 200) {
      const want = targetTop(id, extra);
      if (want === null || corrections >= 3 || Math.abs(want - window.scrollY) <= 2) return;
      corrections += 1;
      window.scrollTo({ top: want, behavior: reduce ? 'auto' : 'smooth' });
      restingSince = now;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Entry-point adjustment: the hero "A better way starts here" link lands 0.5px
// below the shared #solutions calibration (nav button unaffected).
export function entryBonus(id: string, anchor: HTMLAnchorElement | null): number {
  if (id === 'solutions' && anchor?.closest('.hp-hero-bottom')) return 0.5;
  return 0;
}
