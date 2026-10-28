'use client';
import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Lightbulb, Coffee, ArrowRight, MousePointer2, Check, Heart, PartyPopper, Search, PencilRuler } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import './career-refresh.css';
import './career-culture-fun.css';

const moments = [
  { id:'voice', label:'Speak up', Icon:MessageCircle, title:'Say it.', note:'Ideas don’t need a job title.' },
  { id:'curiosity', label:'Stay curious', Icon:Lightbulb, title:'Ask why.', note:'A good question goes a long way.' },
  { id:'human', label:'Be human', Icon:Coffee, title:'Be you.', note:'There’s room for the rest of you.' },
];
function CultureVisual({id}:{id:string}){
  if(id==='voice') return <div className="cv-chat" aria-label="Illustrative team conversation"><div className="cv-chat-top"><MessageCircle size={18}/><span>A little back-and-forth</span><span className="cv-chat-dots">•••</span></div><div className="cv-bubble cv-question"><span>A fresh perspective</span><p>What if we tried it this way?</p><MousePointer2 size={18}/></div><div className="cv-bubble cv-answer"><span>A listening ear</span><p>Show us. We’re all ears.</p><Heart size={18}/></div><div className="cv-reaction"><Lightbulb size={14}/><span>Good ideas welcome.</span></div></div>;
  if(id==='curiosity') return <div className="cv-idea-board" aria-label="Illustrative idea journey: ask, try, learn"><div className="cv-board-heading"><Lightbulb size={20}/><span>One question. New possibilities.</span></div><div className="cv-idea-flow"><div><span className="cv-idea-icon"><Search size={30}/></span><strong>Ask.</strong><small>What’s the real problem?</small></div><ArrowRight className="cv-flow-arrow" size={22}/><div><span className="cv-idea-icon"><PencilRuler size={30}/></span><strong>Try.</strong><small>Make an idea tangible.</small></div><ArrowRight className="cv-flow-arrow" size={22}/><div><span className="cv-idea-icon"><Lightbulb size={30}/></span><strong>Learn.</strong><small>Find a better way.</small></div></div><span className="cv-idea-note">“What if?” is a pretty good start.</span></div>;
  return <div className="cv-human-board" aria-label="Illustrative moments beyond the work"><div className="cv-board-heading"><Heart size={20}/><span>Room for the in-between</span></div><div className="cv-life-moment"><span><PartyPopper size={27}/></span><div><strong>Someone’s big day.</strong><small>Save a slice of cake.</small></div><Heart size={18}/></div><div className="cv-life-moment"><span><Coffee size={27}/></span><div><strong>One proper chai.</strong><small>And a good conversation.</small></div><Check size={18}/></div><span className="cv-human-note">People, not just profiles.</span></div>;
}
const SWITCH_EVERY = 2000;

export default function CultureCards(){
  const [active,setActive]=useState(moments[0].id);
  const [paused,setPaused]=useState(false);
  const [visible,setVisible]=useState(false);
  const [stopped,setStopped]=useState(false); // once someone picks a tab themselves, stop switching for them
  const root=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const el=root.current;if(!el)return;
    const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:0});
    observer.observe(el);return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if(paused||stopped||!visible||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const timer=window.setTimeout(()=>setActive(current=>moments[(moments.findIndex(m=>m.id===current)+1)%moments.length].id),SWITCH_EVERY);
    return()=>window.clearTimeout(timer);
  },[active,paused,stopped,visible]);
  return <Tabs ref={root} onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocus={()=>setPaused(true)} onBlur={()=>setPaused(false)} value={active} onValueChange={value=>{setActive(value);setStopped(true);}} className="cv-culture cv-culture-fun">
  <div className="cv-picker"><TabsList className="cv-tabs" aria-label="Explore life at Handysolver">{moments.map(({id,label,Icon},index)=><TabsTrigger className="cv-tab" value={id} key={id}><small>0{index+1}</small><Icon size={20}/><span>{label}</span><ArrowRight size={15}/></TabsTrigger>)}</TabsList></div>
  {moments.map((moment,index)=><TabsContent className="cv-panel" value={moment.id} key={moment.id}><div className="cv-visual"><CultureVisual id={moment.id}/></div><div className="cv-copy"><moment.Icon className="cv-giant-icon" strokeWidth={1}/><span className="cv-number">0{index+1}</span><h3>{moment.title}</h3><span className="cv-handwritten">{moment.note}</span><i className="cv-doodle" aria-hidden="true"/></div></TabsContent>)}
</Tabs>;
}
