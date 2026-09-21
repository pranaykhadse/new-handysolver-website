'use client';
import { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
export default function MotionEffects() {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setPaused(preference.matches);
    sync();
    preference.addEventListener('change', sync);
    const targets = document.querySelectorAll<HTMLElement>('.section-top, .service, .approach > div, .about > *, .cta, .workplace > *, .opportunity-panel');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); }
    }), { threshold: 0.08 });
    targets.forEach((target, i) => {
      target.style.setProperty('--reveal-delay', `${target.classList.contains('service') ? (i % 3) * 90 : 0}ms`);
      target.classList.add('reveal-ready');
      observer.observe(target);
    });
    const cards = document.querySelectorAll<HTMLElement>('.service, .hero-art');
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const el = event.currentTarget as HTMLElement;
      const bounds = el.getBoundingClientRect();
      el.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
      el.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
    };
    cards.forEach(el => el.addEventListener('pointermove', move));
    return () => { observer.disconnect(); preference.removeEventListener('change', sync); cards.forEach(el => el.removeEventListener('pointermove', move)); targets.forEach(el=>el.classList.remove('reveal-ready')); };
  }, []);
  useEffect(() => { document.documentElement.classList.toggle('motion-paused', paused); return () => document.documentElement.classList.remove('motion-paused'); }, [paused]);
  return <button type="button" className="motion-toggle" onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label={paused ? 'Resume animations' : 'Pause animations'}>{paused ? <Play size={12}/> : <Pause size={12}/>}<span>{paused ? 'Motion off' : 'Motion on'}</span></button>;
}
