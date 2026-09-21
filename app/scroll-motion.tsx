'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// ── Anchor smooth scroll ────────────────────────────────────────────────────
function easeOutExpo(t: number) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}
let anchorFrame = 0;
function smoothScrollTo(targetY: number) {
  if (anchorFrame) { cancelAnimationFrame(anchorFrame); anchorFrame = 0; }
  const html = document.documentElement;
  const startY = html.scrollTop || window.scrollY;
  const diff = targetY - startY;
  if (Math.abs(diff) < 1) return;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  const duration = Math.min(900, Math.max(420, Math.abs(diff) * 0.45));
  const startedAt = performance.now();
  function frame() {
    const t = Math.min((performance.now() - startedAt) / duration, 1);
    const y = startY + diff * easeOutExpo(t);
    html.scrollTop = y;
    window.scrollTo(0, y);
    if (t < 1) { anchorFrame = requestAnimationFrame(frame); }
    else { anchorFrame = 0; html.style.scrollBehavior = prev; }
  }
  anchorFrame = requestAnimationFrame(frame);
}

// ── Parallax layer config ───────────────────────────────────────────────────
const PARALLAX_LAYERS = [
  { selector: '.pc-scrapbook', rate:  0.18 },
  { selector: '.pc-strip',     rate:  0.06 },
  { selector: '.gl-hero h1',   rate: -0.07 },
  { selector: '.tw-hello',     rate:  0.12 },
  { selector: '.lt-note',      rate:  0.10 },
];

// ── Single unified rAF loop ─────────────────────────────────────────────────
// One loop handles progress bar + parallax + skew.
// Reads ALL layout values first, then writes ALL DOM mutations — no thrashing.
function startVisualLoop(): () => void {

  // --- Parallax elements ---
  type PLayer = { el: HTMLElement; rate: number };
  const parallaxLayers: PLayer[] = PARALLAX_LAYERS.flatMap(({ selector, rate }) =>
    Array.from(document.querySelectorAll<HTMLElement>(selector)).map(el => {
      el.style.willChange = 'transform';
      return { el, rate };
    })
  );

  // --- Skew target ---
  const skewEl = document.querySelector<HTMLElement>('main');
  if (skewEl) skewEl.style.willChange = 'transform';
  const MAX_SKEW = 0.4;
  const VELOCITY_SCALE = 0.012;
  const SPRING = 0.09;
  let prevScrollY = window.scrollY;
  let skew = 0;

  let raf = 0;
  function tick() {
    // ── READ phase (no DOM writes here) ──────────────────────────
    const scrollY  = window.scrollY;
    const vh       = window.innerHeight;

    const velocity    = scrollY - prevScrollY;
    prevScrollY       = scrollY;
    const targetSkew  = Math.max(-MAX_SKEW, Math.min(MAX_SKEW, velocity * VELOCITY_SCALE));
    skew             += (targetSkew - skew) * SPRING;

    // Pre-compute parallax offsets (getBoundingClientRect reads layout — do before writes)
    const parallaxOffsets = parallaxLayers.map(({ el, rate }) => {
      const rect   = el.getBoundingClientRect();
      const centre = rect.top + rect.height / 2;
      return { el, offset: ((vh / 2) - centre) * rate };
    });

    // ── WRITE phase ───────────────────────────────────────────────
    parallaxOffsets.forEach(({ el, offset }) => {
      el.style.transform = `translateY(${offset.toFixed(2)}px)`;
    });

    if (skewEl) {
      if (Math.abs(skew) > 0.001) {
        skewEl.style.transform = `skewY(${skew.toFixed(3)}deg)`;
      } else {
        skewEl.style.transform = '';
        skew = 0;
      }
    }

    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    parallaxLayers.forEach(({ el }) => { el.style.transform = ''; el.style.willChange = ''; });
    if (skewEl) { skewEl.style.transform = ''; skewEl.style.willChange = ''; }
  };
}

// ── ScrollMotion component ──────────────────────────────────────────────────
export default function ScrollMotion() {
  const pathname = usePathname();
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleAnchorClick = (e: MouseEvent) => {
      if (reduced.matches) return;
      const anchor = (e.target as Element).closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const id = anchor.getAttribute('href')!.slice(1);
      const el = id ? document.getElementById(id) : null;
      if (!el && id) return;
      e.preventDefault();
      e.stopPropagation();
      const scrollPad = parseInt(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const targetY = Math.max(0, el
        ? el.getBoundingClientRect().top + window.scrollY - scrollPad
        : 0);
      smoothScrollTo(targetY);
      if (id) history.pushState(null, '', `#${id}`);
    };
    document.addEventListener('click', handleAnchorClick, { capture: true });

    const stopVisuals = !reduced.matches ? startVisualLoop() : null;

    if (!('IntersectionObserver' in window)) {
      return () => {
        document.removeEventListener('click', handleAnchorClick, { capture: true });
        stopVisuals?.();
      };
    }

    const seen = new WeakSet<Element>();
    const animations = new Set<Animation>();
    const selector = 'main > section, main > div > section, .hp-reveal, .or-job, .tw-portrait, .tw-you';
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (entry.target.matches('.vs-card') && entry.intersectionRatio < .25) return;
        observer.unobserve(entry.target);
        entry.target.classList.add('motion-arrived');
        if (reduced.matches || entry.target.contains(document.activeElement)) return;
        const element = entry.target as HTMLElement;
        if (!element.animate) return;
        const siblings = element.parentElement ? Array.from(element.parentElement.children) : [];
        const serviceCard = element.matches('.vs-card');
        const stagger = serviceCard
          ? siblings.indexOf(element) * 220
          : element.matches('.tw-portrait, .tw-you, .or-job')
            ? (siblings.indexOf(element) % 4) * 55
            : 0;
        const mobile = window.matchMedia('(max-width: 760px)').matches;
        const frames: Keyframe[] = serviceCard ? [
          { opacity: .35, transform: `perspective(1200px) translateY(${mobile ? 22 : 42}px) rotateY(${mobile ? -32 : -68}deg) rotateX(6deg) scale(.97)`, offset: 0 },
          { opacity: 1, offset: .35 },
          { transform: 'perspective(1200px) translateY(-3px) rotateY(2deg) rotateX(0deg) scale(1)', offset: .8 },
          { opacity: 1, transform: 'perspective(1200px) translateY(0) rotateY(0deg) rotateX(0deg) scale(1)', offset: 1 },
        ] : [
          { opacity: .2, translate: mobile ? '0 14px' : '0 24px' },
          { opacity: 1, translate: '0 0' },
        ];
        const animation = element.animate(frames, {
          duration: serviceCard ? (mobile ? 1050 : 1400) : (mobile ? 450 : 620),
          delay: mobile ? (serviceCard ? 0 : Math.min(stagger, 55)) : stagger,
          easing: serviceCard ? 'cubic-bezier(.3,.1,.25,1)' : 'cubic-bezier(.22,1,.36,1)',
          fill: 'backwards',
        });
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      });
    }, { threshold: [0, .25], rootMargin: '0px 0px -35px 0px' });

    const register = () => {
      Array.from(document.querySelectorAll<HTMLElement>(selector)).forEach(element => {
        if (seen.has(element)) return;
        seen.add(element);
        if (element.querySelector(selector)) return;
        if (element.getBoundingClientRect().top < window.innerHeight) return;
        observer.observe(element);
      });
    };
    register();
    const mutations = new MutationObserver(register);
    const main = document.querySelector('main');
    if (main) mutations.observe(main, { childList: true, subtree: true });
    const cancel = () => { animations.forEach(a => a.cancel()); animations.clear(); };
    const onReduced = () => { if (reduced.matches) cancel(); };
    reduced.addEventListener('change', onReduced);
    document.addEventListener('focusin', cancel);

    return () => {
      observer.disconnect(); mutations.disconnect(); cancel(); stopVisuals?.();
      reduced.removeEventListener('change', onReduced);
      document.removeEventListener('focusin', cancel);
      document.removeEventListener('click', handleAnchorClick, { capture: true });
    };
  }, [pathname]);
  return null;
}
