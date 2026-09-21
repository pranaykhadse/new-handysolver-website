'use client';
import { ArrowUpRight, Check, ArrowRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const options = [
  { id:'repeat', label:'The same task. Again.', note:'It’s 4 pm. You’re still copying yesterday’s data.', title:'Give the busywork a day off.', text:'Connect the steps and automate the repetition, so your people can spend more time on work that needs them.', from:['Copy the details','Update another sheet','Send another reminder'], to:['Information flows','Updates stay connected','Follow-ups happen'], tag:'Automation & applied AI' },
  { id:'scattered', label:'Nothing talks to anything.', note:'Three tools. Four versions. Which one is right?', title:'Get everyone on the same page.', text:'Bring your systems and processes together so information travels with the work, instead of getting stuck between teams.', from:['Check this system','Ask that team','Find the latest version'], to:['Connected tools','Shared information','A clearer picture'], tag:'Business transformation' },
  { id:'fit', label:'Our software doesn’t fit.', note:'A workaround for the workaround. Sound familiar?', title:'Build around your business.', text:'Create web and mobile software around the way your team works, rather than asking everyone to squeeze into someone else’s process.', from:['Make an exception','Add a workaround','Explain it all again'], to:['Your process','Your team’s needs','One thoughtful solution'], tag:'Custom software' },
];

export function HeadachePicker() {
  return <Tabs defaultValue="repeat" className="hp-picker">
    <TabsList className="hp-picker-tabs" aria-label="What is slowing your business down?">{options.map(o=><TabsTrigger value={o.id} key={o.id}>{o.label}</TabsTrigger>)}</TabsList>
    {options.map(o=><TabsContent className="hp-picker-content" key={o.id} value={o.id}>
      <div className="hp-picker-story"><span className="hp-handwritten">{o.note}</span><h3>{o.title}</h3><p>{o.text}</p><a href="/lets-talk">Let’s talk about {o.tag.toLowerCase()} <ArrowUpRight size={17}/></a></div>
      <div className="hp-before-after" aria-label="An illustrative change from manual steps to a simpler process"><div className="hp-before"><span>From this…</span>{o.from.map(t=><p key={t}>{t}<span>↗</span></p>)}</div><ArrowRight className="hp-transform-arrow" size={27}/><div className="hp-after"><span>…to something simpler.</span>{o.to.map(t=><p key={t}><Check size={15}/>{t}</p>)}</div></div>
    </TabsContent>)}
  </Tabs>;
}

export function HomeMotion() {
  // Shared header now owns the route-aware motion lifecycle.
  return null;
}
