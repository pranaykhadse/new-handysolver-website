'use client';
import { useEffect, useRef, useState } from 'react';

export default function MissionCounter() {
  const ref = useRef<HTMLElement>(null);
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || started.current) return;
    started.current = true;
    const duration = 1400;
    const target = 100;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [visible]);

  return (
    <section className="hr-mission" ref={ref} aria-label="Our ambition">
      <div className={`hp-wrap hr-mission-wrap${visible ? ' hr-mission-in' : ''}`}>
        <span>OUR AMBITION</span>
        <p>
          Help <strong><span className="hr-count" aria-live="polite">{count}</span> companies</strong> reach <em>2&times; growth.</em>
        </p>
      </div>
    </section>
  );
}
