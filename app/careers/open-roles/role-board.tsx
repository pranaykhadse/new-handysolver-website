'use client';
import { useEffect, useState, type ComponentType } from 'react';
import { ArrowUpRight, ArrowRight, RefreshCw, MapPin, BriefcaseBusiness, BellRing, Boxes, ShoppingBag, Building2, HardHat, Factory, HeartPulse, Hotel, Users } from 'lucide-react';

const ICONS: Record<string, ComponentType<{ size?: number }>> = {
  'bell-ring': BellRing, 'boxes': Boxes, 'shopping-bag': ShoppingBag, 'building-2': Building2,
  'hard-hat': HardHat, 'factory': Factory, 'heart-pulse': HeartPulse,
  'briefcase-business': BriefcaseBusiness, 'hotel': Hotel, 'users': Users,
};
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@/components/ui/empty';

import { ApplicationPrep, ApplyModal } from './candidate-extras';

const portal = 'https://handysolver.myhandydash.com/backend/web/job-handler/default/jobs';
type Job = {id:string; title:string; intro:string; icon:string; type:string; location:string; experience:string; salary:string; qualification:string; sections:{label:string;text:string}[]};
export default function RoleBoard(){
  const [jobs,setJobs] = useState<Job[]>([]);
  const [state,setState] = useState<'loading'|'ready'|'error'>('loading');
  const [attempt,setAttempt] = useState(0);
  const [applyJob,setApplyJob] = useState<string|null>(null);
  useEffect(()=>{
    const controller = new AbortController();
    setState('loading');
    fetch('/api/open-roles',{signal:controller.signal,cache:'no-store'}).then(async r=>{
      if(!r.ok) throw new Error('Unavailable');
      const data = await r.json();
      if(!Array.isArray(data.jobs)) throw new Error('Invalid data');
      setJobs(data.jobs);setState('ready');
    }).catch(()=>{if(!controller.signal.aborted)setState('error');});
    return ()=>controller.abort();
  },[attempt]);
  return <section className="or-board" aria-label="Current openings" aria-busy={state==='loading'}>
    <div className="or-board-top"><div><span className="or-dot"/> <span aria-live="polite">{state==='loading'?'Checking the latest openings…':state==='ready'?`${jobs.length} ${jobs.length===1?'opportunity':'opportunities'} to explore`:'Let’s try that again.'}</span></div><span>YOUR NEXT CHAPTER ↓</span></div>
    {state==='loading'?<div className="or-loading"><p>Finding a place for your curious side.</p>{[1,2,3].map(i=><Skeleton className="or-skeleton" key={i}/> )}</div>:state==='error'?<Empty className="or-empty"><EmptyHeader><EmptyTitle>The job board is taking a moment.</EmptyTitle><EmptyDescription>We couldn’t reach the latest listings. That doesn’t mean there are no openings.</EmptyDescription></EmptyHeader><div className="or-recovery"><Button className="or-button" onClick={()=>setAttempt(a=>a+1)}><RefreshCw size={16}/>Try again</Button><a href={portal} target="_blank" rel="noopener noreferrer">Open recruitment portal <ArrowUpRight size={16}/></a></div></Empty>:jobs.length===0?<Empty className="or-empty"><EmptyHeader><EmptyTitle>No open roles listed right now.</EmptyTitle><EmptyDescription>Good timing is part of finding a good fit. Check back here for new opportunities.</EmptyDescription></EmptyHeader><a href="/careers" className="or-text-link">Get to know the team <ArrowRight size={16}/></a></Empty>:<Accordion type="single" collapsible className="or-list">{jobs.map((job,index)=><AccordionItem value={job.id} key={job.id} className="or-job"><AccordionTrigger className="or-job-trigger">{(()=>{const Icon=job.icon?ICONS[job.icon]:null;return Icon?<span className="or-job-icon"><Icon size={18}/></span>:<span className="or-number">{String(index+1).padStart(2,'0')}</span>;})()}<span className="or-job-main"><strong>{job.title}</strong><span className="or-tags">{job.type&&<span><BriefcaseBusiness size={12}/>{job.type}</span>}{job.location&&<span><MapPin size={12}/>{job.location}</span>}{job.experience&&<span>{job.experience}</span>}</span></span><span className="or-discover">Take a look</span></AccordionTrigger><AccordionContent className="or-job-content"><div className="or-description">{job.intro&&<p className="or-intro">{job.intro}</p>}{job.sections.map(section=><div key={section.label}><h3>{section.label}</h3><p>{section.text}</p></div>)}{job.qualification&&<div><h3>Qualification</h3><p>{job.qualification}</p></div>}{job.salary&&<div><h3>Salary</h3><p>{job.salary}</p></div>}</div><aside className="or-apply"><span>THIS FEELS LIKE YOU?</span><h3>Let’s meet<br/><em>your curious side.</em></h3><p>Apply through our recruitment portal. Select <strong>{job.title}</strong> and complete the application there.</p><ApplicationPrep/><button className="or-button" onClick={()=>setApplyJob(job.title)}>Continue to apply <ArrowUpRight size={18}/></button><small>Fill in the form to send your application directly.</small></aside></AccordionContent></AccordionItem>)}</Accordion>}
    <div className="or-feed-note"><span>Listings loaded from our recruitment portal. Availability can change.</span><a href={portal} target="_blank" rel="noopener noreferrer">View original listings <ArrowUpRight size={13}/></a></div>
    {applyJob && <ApplyModal jobTitle={applyJob} onClose={()=>setApplyJob(null)}/>}
  </section>;
}
