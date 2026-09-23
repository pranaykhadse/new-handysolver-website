'use client';
import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Copy, Check, Send } from 'lucide-react';

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const topics = ['Connect our systems', 'Build something custom', 'Automate the busywork', 'Still figuring it out'];
export default function MessageBuilder(){
  const [channel,setChannel]=useState('whatsapp');
  const [topic,setTopic]=useState(topics[0]);
  const [name,setName]=useState('');
  const [company,setCompany]=useState('');
  const [message,setMessage]=useState('');
  const [status,setStatus]=useState('');
  const body=()=>`Hi HandySolver,\n\nI'd like to talk about: ${topic}.\n\n${message.trim()}\n\n${name.trim()}${company.trim()?`\n${company.trim()}`:''}`;
  function draft(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(channel==='whatsapp'){
      window.location.href=`https://wa.me/919971815001?text=${encodeURIComponent(body())}`;
      setStatus('Continue in WhatsApp to review and send your message to +91 99718 15001. This page has not sent it.');
    }else{
      const subject = encodeURIComponent("Let's talk: " + topic);
      const bodyText = encodeURIComponent(body());
      const gmailUrl = 'https://mail.google.com/mail/?view=cm&to=connect%40handysolver.com&su=' + subject + '&body=' + bodyText;
      window.open(gmailUrl, '_blank', 'noopener,noreferrer');
      setStatus('Gmail should open in a new tab with your draft. Review it and press Send there. Nothing has been sent by this page.');
    }
  }
  async function copy(){try{await navigator.clipboard.writeText(body());setStatus(channel==='whatsapp'?'Message copied. Paste it into WhatsApp to +91 99718 15001.':'Message copied. Paste it into Gmail to connect@handysolver.com.');}catch{setStatus("Copy isn't available here. Select your message to copy it manually.");}}
  return <form className="lt-form" onSubmit={draft}>
    <div className="lt-form-top"><span>A GOOD CONVERSATION STARTS HERE</span><Send size={22} aria-hidden="true"/></div>
    <h2>{"What's on "}<em>{"your mind?"}</em></h2>
    <fieldset className="lt-channel"><legend>{"Let's connect on"}</legend><RadioGroup value={channel} onValueChange={value=>{setChannel(value);setStatus('');}} className="lt-channel-options" aria-label="Contact method"><label data-active={channel==='whatsapp'}><RadioGroupItem value="whatsapp"/><WhatsAppIcon/><span>WhatsApp<small>Quick and easy</small></span></label><label data-active={channel==='email'}><RadioGroupItem value="email"/><EmailIcon/><span>Email<small>Prefer your inbox?</small></span></label></RadioGroup></fieldset>
    <fieldset className="lt-topics"><legend>{"I'd like to…"}</legend>{topics.map(item=><Button key={item} type="button" variant="outline" aria-pressed={topic===item} onClick={()=>setTopic(item)}>{topic===item&&<Check size={13}/>} {item}</Button>)}</fieldset>
    <div className="lt-fields"><label>Your name <span>*</span><Input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} required maxLength={100} placeholder="What should we call you?"/></label><label>Company <small>(optional)</small><Input autoComplete="organization" value={company} onChange={e=>setCompany(e.target.value)} maxLength={150} placeholder="Where you make things happen"/></label></div>
    <label className="lt-message">The short version <span>*</span><Textarea value={message} onChange={e=>setMessage(e.target.value)} required maxLength={1800} rows={5} placeholder="What's taking too much time? What would you love to make easier? A few lines are plenty."/></label>
    <div className="lt-message-meta"><span>No perfect brief needed.</span><span>{message.length}/1800</span></div>
    <div className="lt-form-actions"><Button className="lt-send" type="submit">{channel==='whatsapp'?<><WhatsAppIcon/>Continue on WhatsApp</>:'Open email draft'} <ArrowUpRight size={18}/></Button><Button type="button" variant="ghost" onClick={copy} disabled={!message.trim()}><Copy size={15}/>Copy message</Button></div>
    <p className="lt-form-note">{channel==='whatsapp'?'Opens WhatsApp with your message for +91 99718 15001.':'Opens Gmail in a new tab with a draft to connect@handysolver.com.'} You review and send it there.<br/>This page does not submit or store your details.</p>
    <p className="lt-status" role="status">{status}</p>
  </form>;
}
