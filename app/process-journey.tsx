'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, MessageCircle, MousePointer2, Check, PencilRuler, HeartHandshake, RefreshCw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import './process-journey.css';

const stages=[
  {id:'hello',number:'01',label:'Say hello.',sub:'Bring the messy version.',Icon:MessageCircle,title:'You talk. We ask good questions.',body:'Bring the messy version. We’ll ask questions and find a clearer starting point together.',you:'Your challenges, ideas, and honest answers.',us:'Questions, listening, and a clearer starting point.',note:'No perfect brief required.'},
  {id:'build',number:'02',label:'Make it real.',sub:'Less mystery. More making.',Icon:PencilRuler,title:'From “what if” to “here it is.”',body:'Agree on a plan. See it take shape. Share feedback while we build.',you:'Your context and feedback along the way.',us:'An agreed plan, hands-on building, and visible progress.',note:'You’re in the loop. Always.'},
  {id:'better',number:'03',label:'Keep making it better.',sub:'Launch is a conversation.',Icon:HeartHandshake,title:'It’s live. Let’s see how it feels.',body:'Launch it. Put it to work. Tell us what could feel even simpler.',you:'Real-world experience with the solution.',us:'A listening ear and a conversation about the next step.',note:'Good work keeps getting better.'},
];
function Example({stage}:{stage:string}){
  return <div className={`pj-example pj-example-${stage}`}><span className="pj-example-label">A little glimpse of the process · illustrative</span>
    {stage==='hello'?<div className="pj-chat"><div className="pj-message"><span>You</span><p>“There has to be an easier way to do this.”</p></div><div className="pj-message pj-reply"><span>HandySolver</span><p>“Show us how it works today. We’re listening.”</p><MessageCircle size={18}/></div></div>:stage==='build'?<div className="pj-work"><div className="pj-work-header"><PencilRuler size={18}/><strong>Making it happen</strong><span>You + us</span></div><div className="pj-task"><Check size={16}/><span>Understand the problem</span><small>Aligned</small></div><div className="pj-task"><Check size={16}/><span>Agree on a plan</span><small>Clear</small></div><div className="pj-task pj-task-current"><span className="pj-working-dot"/><span>Build, share, discuss</span><small>In the loop</small></div><p className="pj-work-note">Nothing hidden behind “we’re working on it.”</p></div>:<div className="pj-feedback"><div className="pj-feedback-title"><Check size={20}/><strong>Out in the real world.</strong></div><div className="pj-feedback-message"><span>Your team</span><p>“This helps. Could we make this part even simpler?”</p></div><div className="pj-feedback-response"><RefreshCw size={17}/><span>Let’s talk about it.</span></div></div>}
  </div>;
}
export default function ProcessJourney(){
 const [stage,setStage]=useState('hello');
 const [visible,setVisible]=useState(false);
 const [reduced,setReduced]=useState(true);
 const [hovered,setHovered]=useState(false);
 const [elapsed,setElapsed]=useState(0);
 const section=useRef<HTMLElement>(null);
 useEffect(()=>{
   const media=window.matchMedia('(prefers-reduced-motion: reduce)');
   const update=()=>setReduced(media.matches);
   update();media.addEventListener('change',update);
   let inView=false;
   const sync=()=>setVisible(inView&&!document.hidden);
   const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();},{threshold:0,rootMargin:'-20% 0px -15% 0px'});
   if(section.current)observer.observe(section.current);
   document.addEventListener('visibilitychange',sync);
   return()=>{observer.disconnect();media.removeEventListener('change',update);document.removeEventListener('visibilitychange',sync);};
 },[]);
 const running=visible&&!reduced&&!hovered;
 useEffect(()=>{if(!running)return;const timer=window.setInterval(()=>setElapsed(value=>value+100),100);return()=>window.clearInterval(timer);},[running]);
 useEffect(()=>{if(elapsed>=9000){setStage(current=>stages[(stages.findIndex(s=>s.id===current)+1)%3].id);setElapsed(0);}},[elapsed]);
 const choose=(value:string)=>{setStage(value);setElapsed(0);};
 return <section ref={section} className="pj-section hp-wrap" id="approach" aria-labelledby="pj-title" data-flow={running?'running':'paused'} data-motion={!reduced}>
   <div className="pj-heading"><div><p className="hp-overline">No disappearing acts.</p><h2 id="pj-title">A little back-and-forth.<br/><em>A lot of forward.</em></h2></div><div className="pj-heading-note"><span><MousePointer2 size={15}/> Pick a step. Get a feel for it.</span></div></div>
   <div className="pj-flow-controls"><span>{reduced?'Explore at your own pace.':hovered?'Paused while you explore.':'Watch the work flow, one step at a time.'}</span><div className="pj-flow-track" aria-hidden="true"><i style={{transform:`scaleX(${elapsed/9000})`}}/></div></div>
   <Tabs value={stage} onValueChange={choose} className="pj-journey" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
    <TabsList className="pj-stages" aria-label="Explore how we work together">{stages.map(({id,number,label,Icon})=><TabsTrigger key={id} value={id} className="pj-stage"><span className="pj-step-marker"><Icon size={23} strokeWidth={1.6}/></span><span className="pj-step-text"><small>STEP {number}</small><span className="pj-stage-title">{label}</span></span></TabsTrigger>)}</TabsList>
    {stages.map((s,i)=><TabsContent className="pj-panel" key={s.id} value={s.id}><div className="pj-story"><span className="pj-chapter">Step {s.number} / 03</span><h3>{s.title}</h3><p>{s.body}</p><Button variant="ghost" className="pj-next" onClick={()=>choose(stages[(i+1)%3].id)}>{i===2?'Back to the first hello':`Next: ${stages[i+1].label}`}<ArrowRight size={17}/></Button></div><div className="pj-scene"><Example stage={s.id}/><span className="pj-note">{s.note}</span></div></TabsContent>)}
   </Tabs>
   <div className="pj-bottom"><p>In it with you. <em>From the first hello.</em></p></div>
 </section>
}
