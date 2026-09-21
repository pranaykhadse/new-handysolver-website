'use client';

import { useEffect, useState } from 'react';
import { Shuffle, Smile, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PHOTO_BASE = 'https://handysolver.com/assets/images/employees/';

type Member = { id: string; name: string; photoUrl: string };

function photoSrc(member: Member) {
  if (!member.photoUrl) return '';
  if (/^https?:\/\//i.test(member.photoUrl)) return member.photoUrl;
  return `${PHOTO_BASE}${member.photoUrl}`;
}

function Portrait({member}:{member:Member}) {
  const [failed,setFailed] = useState(false);
  const src = photoSrc(member);
  return failed||!src?<div className="tw-photo-fallback"><Smile size={40}/><span>One of our humans.</span></div>:<img src={src} alt={member.name||'HandySolver team member'} loading="lazy" onError={()=>setFailed(true)}/>;
}

export default function TeamWall(){
  const [order,setOrder] = useState<Member[]>([]);
  const [mix,setMix] = useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    fetch('/api/team',{signal:controller.signal,cache:'no-store'}).then(async r=>{
      if(!r.ok)return;
      const payload=await r.json();
      if(Array.isArray(payload.members))setOrder(payload.members);
    }).catch(()=>{});
    return ()=>controller.abort();
  },[]);
  function shuffle(){
    setOrder(current=>{const next=[...current];for(let i=next.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[next[i],next[j]]=[next[j],next[i]];}return next;});
    setMix(n=>n+1);
  }
  if(order.length===0){
    return <section className="tw-wall" aria-labelledby="wall-title">
      <div className="tw-wall-top"><div><p className="hp-overline">THE PEOPLE PART</p><h2 id="wall-title">Different faces.<br/><em>One handy bunch.</em></h2></div></div>
      <div className="tw-grid"><div className="tw-photo-fallback"><Smile size={40}/><span>Gathering the bunch…</span></div></div>
    </section>;
  }
  return <section className="tw-wall" aria-labelledby="wall-title">
    <div className="tw-wall-top"><div><p className="hp-overline">THE PEOPLE PART</p><h2 id="wall-title">Different faces.<br/><em>One handy bunch.</em></h2></div><div className="tw-wall-action"><span>No particular order. Just good company.</span><Button variant="outline" onClick={shuffle}><Shuffle size={16}/>Mix things up</Button><span className="sr-only" aria-live="polite">{mix>0?'Photo order shuffled.':''}</span></div></div>
    <div className="tw-grid" key={mix}>{order.map((member,index)=><figure className="tw-portrait" key={member.id}><div className="tw-photo"><Portrait member={member}/></div><figcaption><span>{member.name||'part of the handy bunch'}</span><span aria-hidden="true">{String(index+1).padStart(2,'0')}</span></figcaption></figure>)}<a className="tw-you" href="/careers/open-roles"><Smile size={40} aria-hidden="true"/><span>And maybe…<br/><em>you?</em></span><small>Find your next thing <ArrowUpRight size={18}/></small></a></div>
  </section>;
}
