'use client';
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
export default function CultureCards(){return <Tabs defaultValue="voice" className="cv-culture cv-culture-fun">
  <div className="cv-picker"><TabsList className="cv-tabs" aria-label="Explore life at HandySolver">{moments.map(({id,label,Icon},index)=><TabsTrigger className="cv-tab" value={id} key={id}><small>0{index+1}</small><Icon size={20}/><span>{label}</span><ArrowRight size={15}/></TabsTrigger>)}</TabsList></div>
  {moments.map((moment,index)=><TabsContent className="cv-panel" value={moment.id} key={moment.id}><div className="cv-visual"><CultureVisual id={moment.id}/></div><div className="cv-copy"><moment.Icon className="cv-giant-icon" strokeWidth={1}/><span className="cv-number">0{index+1}</span><h3>{moment.title}</h3><span className="cv-handwritten">{moment.note}</span><i className="cv-doodle" aria-hidden="true"/></div></TabsContent>)}
</Tabs>;}
