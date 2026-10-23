'use client';

import { useState } from 'react';
import { ArrowUpRight, RotateCw, Smile, Check, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const nudges = [
  ['You’re more than', 'a PDF.', 'Your CV is a starting point. Your ideas, questions and experiences bring it to life.'],
  ['Small project.', 'Big you.', 'Think of something you enjoyed making or improving. What did you bring to it?'],
  ['Take a breath.', 'Be yourself.', 'Read the role, get curious, and give yourself a moment to decide.'],
];

export function CandidateNudge() {
  const [index, setIndex] = useState(0);
  return <aside className="ce-nudge" aria-label="A little encouragement">
    <div className="ce-nudge-top"><span>A LITTLE NUDGE</span><Smile size={30} aria-hidden="true"/></div>
    <div className="ce-nudge-copy" aria-live="polite" key={index}><h2>{nudges[index][0]}<br/><em>{nudges[index][1]}</em></h2><p>{nudges[index][2]}</p></div>
    <div className="ce-nudge-bottom"><span aria-hidden="true">{nudges.map((_,i)=><i key={i} className={i===index?'is-current':''}/>)}</span><Button variant="ghost" onClick={()=>setIndex(i=>(i+1)%nudges.length)}>Another nudge <RotateCw size={14}/></Button></div>
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
