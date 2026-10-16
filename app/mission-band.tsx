'use client';
import { useEffect, useRef } from 'react';

export default function MissionBand() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return;
    el.classList.add('hr-armed');
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      el.classList.add('hr-play');
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="hr-mission" aria-label="Our ambition">
      <div className="hp-wrap">
        <span>OUR AMBITION</span>
        <p>Help <strong>100 companies</strong> reach <em>2&times; growth.</em></p>
      </div>
    </section>
  );
}
