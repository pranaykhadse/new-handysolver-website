'use client';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ArrowDown, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import './knot-scene.css';

export default function KnotScene() {
  const scene = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const moving = visible && allowed && !paused;
  useEffect(() => {
    const element = scene.current;
    if (!element) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let inView = true;
    const sync = () => {setAllowed(!preference.matches);setVisible(inView && !document.hidden);};
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;sync();
    }, {threshold: 0.05}) : null;
    observer?.observe(element);
    preference.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {observer?.disconnect();preference.removeEventListener('change', sync);document.removeEventListener('visibilitychange', sync);};
  }, []);
  const reset = () => {scene.current?.style.setProperty('--knot-x', '0');scene.current?.style.setProperty('--knot-y', '0');};
  useEffect(() => {if (!moving) reset();}, [moving]);
  const tilt = (event: PointerEvent<HTMLDivElement>) => {
    if (!moving || event.pointerType !== 'mouse') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const clamp = (value: number) => Math.max(-1, Math.min(1, value));
    event.currentTarget.style.setProperty('--knot-x', String(clamp((event.clientX-bounds.left)/bounds.width*2-1)));
    event.currentTarget.style.setProperty('--knot-y', String(clamp((event.clientY-bounds.top)/bounds.height*2-1)));
  };
  return <div ref={scene} className="hp-knot-scene hp-knot-alive" data-moving={moving} onPointerMove={tilt} onPointerLeave={reset} onPointerCancel={reset}>
    <div className="hp-knot-depth">
      <div className="hp-knot-picture"><img src="/untangled-cord.png" alt="A loose knot of orange cotton cord on lavender paper" width="1024" height="1024" fetchPriority="high"/></div>
      <span className="hp-knot-note">a little tangled?<br/><em>we get it.</em></span>
      <a className="hp-knot-link" href="#solutions">Let’s work it out <ArrowDown size={19}/></a>
    </div>
    {allowed && <Button variant="ghost" size="sm" className="hp-knot-motion-toggle" onClick={()=>setPaused(value=>!value)} aria-label={paused?'Resume decorative motion':'Pause decorative motion'}>{paused?<Play size={11}/>:<Pause size={11}/>}<span>{paused?'Play motion':'Pause motion'}</span></Button>}
  </div>;
}
