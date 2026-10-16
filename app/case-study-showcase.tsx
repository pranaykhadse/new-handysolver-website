'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BellRing, Boxes, BriefcaseBusiness, Building2, Check, Factory, HardHat, HeartPulse, Hotel, ShoppingBag, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import './case-study-showcase.css';
import './case-study-browser.css';

type Study = {
  id: string; label: string; metric: string; title: string;
  before: string; changed: string; result: string; tags: string[];
  icon: string; number: string;
};

type IconComponent = ComponentType<{ size?: number | string; strokeWidth?: number | string }>;

const ICONS: Record<string, IconComponent> = {
  'bell-ring': BellRing, 'boxes': Boxes, 'shopping-bag': ShoppingBag, 'building-2': Building2,
  'hard-hat': HardHat, 'factory': Factory, 'heart-pulse': HeartPulse,
  'briefcase-business': BriefcaseBusiness, 'hotel': Hotel, 'users': Users,
};

export default function CaseStudyShowcase(){
  const [studies,setStudies]=useState<Study[]>([]);
  const [active,setActive]=useState<string|null>(null);
  const [opened,setOpened]=useState(false);
  const list=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const controller=new AbortController();
    fetch('/api/case-studies',{signal:controller.signal,cache:'no-store'}).then(async r=>{
      if(!r.ok)return;
      const payload=await r.json();
      if(Array.isArray(payload.studies))setStudies(payload.studies.map((study: Omit<Study,'number'>,index: number)=>({...study,number:String(index+1).padStart(2,'0')})));
    }).catch(()=>{});
    return ()=>controller.abort();
  },[]);
  const current=active??studies[0]?.id??null;
  const index=Math.max(0,studies.findIndex(study=>study.id===current));
  const choose=(id:string)=>{setActive(id);setOpened(true)};
  useEffect(()=>{
    const rail=list.current;
    const card=rail?.querySelector<HTMLElement>('[data-state=active]');
    if(!opened||!rail||!card)return;
    const a=rail.getBoundingClientRect(), b=card.getBoundingClientRect();
    rail.scrollBy({left:b.left-a.left-(a.width-b.width)/2,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  },[current,opened]);
  const next=()=>{if(studies.length===0)return;setActive(studies[(index+1)%studies.length].id);setOpened(true)};
  if(studies.length===0){
    return <section className="cs-section" aria-labelledby="cs-title">
      <div className="hp-wrap">
        <div className="cs-heading hp-reveal"><div><h2 id="cs-title">Real problems.<br/><em>Useful outcomes.</em></h2></div><p>Gathering our stories…</p></div>
      </div>
    </section>;
  }
  return <section className="cs-section" aria-labelledby="cs-title">
    <div className="hp-wrap">
      <div className="cs-heading hp-reveal"><div><h2 id="cs-title">Real problems.<br/><em>Useful outcomes.</em></h2></div><p>{studies.length} quick examples of everyday business friction made simpler. Pick one that feels familiar.</p></div>
      <Tabs className="cs-tabs" value={current??studies[0].id} onValueChange={choose}>
        <div className="cs-browse-head"><span>Browse all {studies.length}</span><div><small>Scroll to explore</small><button type="button" onClick={()=>list.current?.scrollBy({left:-330,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})} aria-label="Previous case studies"><ArrowLeft/></button><button type="button" onClick={()=>list.current?.scrollBy({left:330,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})} aria-label="More case studies"><ArrowRight/></button></div></div>
        <div className="cs-list-shell"><TabsList ref={list} className="cs-list" aria-label="Choose a case study">{studies.map(({id,number,label,metric,title,icon})=>{const Icon=ICONS[icon]??Boxes;return <TabsTrigger className="cs-card" value={id} key={id} onClick={()=>choose(id)}>
          <span className="cs-card-top"><small>{number} / {label}</small><Icon size={21} strokeWidth={1.7}/></span><strong>{metric}</strong><span>{title}</span><i aria-hidden="true"><ArrowRight size={17}/></i>
        </TabsTrigger>})}</TabsList></div>
        {!opened&&<button className="cs-open-hint" type="button" onClick={()=>setOpened(true)}>Pick a story to unfold it <ArrowRight size={17}/></button>}
        {opened&&studies.map(study=><TabsContent className="cs-story" value={study.id} key={study.id}>
          <div className="cs-story-lead"><span>CASE {study.number} OF {studies.length}</span><h3>{study.title}</h3><div>{study.tags.map(tag=><small key={tag}>{tag}</small>)}</div></div>
          <div className="cs-story-steps"><article><span>BEFORE</span><p>{study.before}</p></article><article><span>WHAT CHANGED</span><p>{study.changed}</p></article><article className="cs-result"><span><Check size={15}/> RESULT</span><p>{study.result}</p></article></div>
          <div className="cs-story-actions"><button type="button" onClick={next}>Next story <ArrowRight size={17}/></button><a href="/lets-talk">Bring us a process like this <ArrowUpRight size={17}/></a></div>
        </TabsContent>)}
      </Tabs>
      <p className="cs-source-note">Outcomes are drawn from project records. Approximate figures are shown with ~.</p>
    </div>
  </section>;
}
