'use client';
import { useEffect } from 'react';

export default function HomeDepth({ rootSelector = '.handy-depth', cardSelector = '.vs-card' }: { rootSelector?: string; cardSelector?: string }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(rootSelector);
    if (!root) return;
    const media = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const cards = Array.from(root.querySelectorAll<HTMLElement>(cardSelector));
    let frame = 0;
    let active: HTMLElement | null = null;
    let x = 0;
    let y = 0;
    const resetCard = () => {
      active?.style.removeProperty('--depth-x');
      active?.style.removeProperty('--depth-y');
      active = null;
    };
    const paint = () => {
      frame = 0;
      if (!media.matches || document.hidden) return;
      if (active) {
        active.style.setProperty('--depth-x', `${x * 2.5}deg`);
        active.style.setProperty('--depth-y', `${y * -2.5}deg`);
      }
      const height = window.innerHeight;
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > height) return;
        const offset = Math.max(-9, Math.min(9, (height / 2 - rect.top - rect.height / 2) * .025));
        card.style.setProperty('--depth-scroll', `${offset}px`);
      });
    };
    const schedule = () => { if (!frame && media.matches && !document.hidden) frame = requestAnimationFrame(paint); };
    const pointer = (event: PointerEvent) => {
      if (!media.matches || event.pointerType !== 'mouse') return;
      const card = (event.target as Element).closest<HTMLElement>(cardSelector);
      if (card !== active) resetCard();
      if (card) {
        active = card;
        const rect = card.getBoundingClientRect();
        x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
        y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
      }
      schedule();
    };
    const sync = () => {
      resetCard();
      cards.forEach(card => card.style.removeProperty('--depth-scroll'));
      schedule();
    };
    root.addEventListener('pointermove', pointer, { passive: true });
    root.addEventListener('pointerleave', resetCard);
    root.addEventListener('pointercancel', resetCard);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('blur', resetCard);
    document.addEventListener('visibilitychange', sync);
    media.addEventListener('change', sync);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resetCard();
      cards.forEach(card => card.style.removeProperty('--depth-scroll'));
      root.removeEventListener('pointermove', pointer);
      root.removeEventListener('pointerleave', resetCard);
      root.removeEventListener('pointercancel', resetCard);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('blur', resetCard);
      document.removeEventListener('visibilitychange', sync);
      media.removeEventListener('change', sync);
    };
  }, [rootSelector, cardSelector]);
  return null;
}
