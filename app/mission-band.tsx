'use client';
import { useEffect, useRef } from 'react';

export default function MissionBand() {
  const host = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLElement>(null);

  useEffect(() => {
    const h = host.current;
    const b = band.current;
    if (!h || !b || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    b.classList.add('hr-armed');
    const observer = new IntersectionObserver(([entry]) => {
      b.classList.toggle('hr-play', entry.isIntersecting);
    }, { threshold: 0.35 });
    observer.observe(h);
    return () => observer.disconnect();
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
