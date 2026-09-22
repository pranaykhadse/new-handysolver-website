'use client';
import { useEffect, useRef, useState } from 'react';
import './hero-headline.css';

const phrase = 'More time for you.';
export default function HeroHeadline() {
  const root = useRef<HTMLDivElement>(null);
  const [allowed, setAllowed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(phrase.length);
  const [erasing, setErasing] = useState(true);
  const moving = allowed && visible;
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let inView = true;
    const sync = () => { setAllowed(!media.matches); setVisible(inView && !document.hidden); };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }, { threshold: .2 });
    if (root.current) observer.observe(root.current);
    media.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => { observer.disconnect(); media.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); };
  }, []);
  useEffect(() => {
    if (!moving) return;
    const delay = count === phrase.length ? 2200 : count === 0 ? 180 : erasing ? 30 : 55;
    const timer = window.setTimeout(() => {
      if (count === phrase.length) { setErasing(true); setCount(count - 1); }
      else if (count === 0) { setErasing(false); setCount(1); }
      else setCount(count + (erasing ? -1 : 1));
    }, delay);
    return () => clearTimeout(timer);
  }, [moving, count, erasing]);
  const shown = !allowed ? phrase : phrase.slice(0, count);
  return <div className="hp-typed-heading" ref={root}>
    <h1 className="hp-benefit-title" aria-label={`Less tangled work. ${phrase}`}>
      <span aria-hidden="true">Less tangled work.<br/><em className="hp-type-line"><span className="hp-type-space">{phrase}</span><span className="hp-type-ink">{shown}<span className="hp-type-caret" data-active={moving && count < phrase.length}/></span></em></span>
    </h1>
  </div>;
}
