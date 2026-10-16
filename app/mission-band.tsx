'use client';
import { useEffect, useRef } from 'react';

export default function MissionBand() {
  const host = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLElement>(null);

  useEffect(() => {
    const h = host.current;
    const b = band.current;
    if (!h || !b || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (h.getBoundingClientRect().top < window.innerHeight * 0.85) return;
    b.classList.add('hr-armed');
    const play = () => { b.classList.add('hr-play'); observer.disconnect(); };
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) play(); }, { threshold: 0.35 });
    observer.observe(h);
    const failsafe = window.setTimeout(() => {
      if (h.getBoundingClientRect().top < window.innerHeight) play();
    }, 4000);
    return () => { observer.disconnect(); window.clearTimeout(failsafe); };
  }, []);

  return (
    <div ref={host}>
      <section ref={band} className="hr-mission" aria-label="Our ambition">
        <div className="hp-wrap">
          <span>OUR AMBITION</span>
          <p>Help <strong>100 companies</strong> reach <em>2&times; growth.</em></p>
        </div>
      </section>
    </div>
  );
}
