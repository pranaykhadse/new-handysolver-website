'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { Check, Copy, RefreshCw, Sheet } from 'lucide-react';
import './day-shift.css';
import './day-shift-mobile.css';

export default function DayShift() {
  const [pct, setPct] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [entered, setEntered] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  // Intro animation: drift from 78% → 50% once when section enters view
  useEffect(() => {
    const el = stageRef.current?.closest('section');
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setEntered(true);
      // Sweep left to reveal the "after" side, then settle at 50%
      const start = performance.now();
      const from = 78, to = 50, dur = 1100;
      const ease = (t: number) => t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
      const step = (now: number) => {
        const t = Math.min((now - start) / dur, 1);
        setPct(from + (to - from) * ease(t));
        if (t < 1) rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(rafRef.current); };
  }, []);

  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  const pctFromPointer = useCallback((e: React.PointerEvent) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return pct;
    return clamp(((e.clientX - r.left) / r.width) * 100);
  }, [pct]);

  const onDown = (e: React.PointerEvent) => {
    cancelAnimationFrame(rafRef.current);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    setPct(pctFromPointer(e));
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setPct(pctFromPointer(e));
  };

  const onUp = () => setDragging(false);

  return (
    <section className="ds-section hp-wrap" aria-labelledby="ds-title">
      <div className="ds-head">
        <div>
          <p className="hp-overline">Slide into a simpler day.</p>
          <h2 id="ds-title">Same workday.<br /><em>Less chasing.</em></h2>
        </div>
        <span className={`ds-hint${dragging ? ' ds-hint--hide' : ''}`} aria-hidden="true">
          Drag the handle →
        </span>
      </div>

      <div
        ref={stageRef}
        className={`ds-stage${dragging ? ' ds-dragging' : ''}${entered ? ' ds-entered' : ''}`}
        style={{ '--shift': `${pct}%` } as CSSProperties}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="group"
        aria-label="Drag to compare the two approaches"
      >
        {/* Before panel */}
        <div className="ds-before">
          <span className="ds-label">THE TANGLED WAY</span>
          <div className="ds-chaos">
            <i className="ds-card" style={{ '--r': '-4deg', '--x': '3%', '--y': '12px', '--delay': '0s' } as CSSProperties}>
              <Copy size={15} />Copy this again
            </i>
            <i className="ds-card" style={{ '--r': '5deg', '--x': 'auto', '--right': '4%', '--y': '72px', '--delay': '.15s' } as CSSProperties}>
              <RefreshCw size={15} />Any update?
            </i>
            <i className="ds-card" style={{ '--r': '-2deg', '--x': '18%', '--y': 'auto', '--bottom': '8px', '--delay': '.08s' } as CSSProperties}>
              <Sheet size={15} />Final_v7.xlsx
            </i>
          </div>
          <strong className="ds-verdict">4 tools. 12 follow-ups.</strong>
        </div>

        {/* After panel */}
        <div className="ds-after">
          <span className="ds-label">THE HANDY WAY</span>
          <div className="ds-flow">
            <i><Check size={14} />Updates connected</i>
            <i><Check size={14} />Reminder sent</i>
            <i><Check size={14} />One live view</i>
          </div>
          <strong className="ds-verdict">More room to think.</strong>
        </div>


        {/* Divider */}
        <div className="ds-divider" aria-hidden="true">
          <div className="ds-divider-glow" />
        </div>

        {/* Handle */}
        <div className={`ds-handle${dragging ? ' ds-handle--active' : ''}`} aria-hidden="true">
          <svg className="ds-handle-icon" viewBox="0 0 44 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 10L4 10M4 10L8 6M4 10L8 14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M31 10L40 10M40 10L36 6M40 10L36 14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="21" y1="2" x2="21" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
            <line x1="23" y1="2" x2="23" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
          </svg>
        </div>
      </div>
    </section>
  );
}
