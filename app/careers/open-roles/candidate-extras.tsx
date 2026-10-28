'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Smile, Check, Coffee } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const nudges = [
  ['You’re more than', 'a PDF.', 'Your CV is a starting point. Your ideas, questions and experiences bring it to life.'],
  ['Small project.', 'Big you.', 'Think of something you enjoyed making or improving. What did you bring to it?'],
  ['Take a breath.', 'Be yourself.', 'Read the role, get curious, and give yourself a moment to decide.'],
];

const NUDGE_EVERY = 2000;

export function CandidateNudge() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (paused || !visible || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => setIndex(i => (i + 1) % nudges.length), NUDGE_EVERY);
    return () => window.clearTimeout(timer);
  }, [index, paused, visible]);
  return <aside ref={root} className="ce-nudge" aria-label="A little encouragement" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
    <div className="ce-nudge-top"><span>A LITTLE NUDGE</span><Smile size={30} aria-hidden="true"/></div>
    <div className="ce-nudge-copy" aria-live="off" key={index}><h2>{nudges[index][0]}<br/><em>{nudges[index][1]}</em></h2><p>{nudges[index][2]}</p></div>
    <div className="ce-nudge-bottom"><span aria-hidden="true">{nudges.map((_,i)=><i key={i} className={i===index?'is-current':''}/>)}</span></div>
  </aside>;
}

export function ApplicationPrep() {
  const [checked, setChecked] = useState<boolean[]>([false,false,false]);
  const count = checked.filter(Boolean).length;
  return <div className="ce-prep">
    <div className="ce-prep-title"><Coffee size={19} aria-hidden="true"/><span>A moment before you jump in</span></div>
    <p>Optional. Just for you, not part of your application.</p>
    {['Read the role and what it involves','Have my CV ready','Think of one thing I’m proud of'].map((label,index)=><label className="ce-check" key={label}><Checkbox checked={checked[index]} onCheckedChange={value=>setChecked(items=>items.map((item,i)=>i===index?value===true:item))}/><span>{label}</span></label>)}
    <div className="ce-prep-status" aria-live="polite">{count===3?<><Check size={15}/>All set. Bring your own kind of handy.</>:<><ArrowUpRight size={15}/>{count} of 3 little things, done.</>}</div>
  </div>;
}
