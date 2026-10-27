'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowLeft, ArrowRight } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import './testimonials.css';

type Testimonial = {
  id: string; name: string; initials: string; label: string; quote: string;
  avatarUrl: string | null; videoUrl: string | null; source: string; sourceLabel: string;
};

function videoEmbed(url: string): { kind: 'iframe' | 'video' | 'link'; src: string } {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    // YouTube
    if (host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com') {
      if (host === 'youtube.com' && parsed.pathname.startsWith('/embed/')) return { kind: 'iframe', src: url };
      if (host === 'youtube.com' && parsed.pathname.startsWith('/shorts/')) {
        const sid = parsed.pathname.split('/')[2];
        if (sid) return { kind: 'iframe', src: `https://www.youtube.com/embed/${sid}` };
      }
      const id = host === 'youtu.be' ? parsed.pathname.slice(1).split('?')[0] : parsed.searchParams.get('v');
      if (id) return { kind: 'iframe', src: `https://www.youtube.com/embed/${id}` };
    }

    // Vimeo
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      if (host === 'player.vimeo.com') return { kind: 'iframe', src: url };
      const vid = parsed.pathname.split('/').filter(Boolean)[0];
      if (vid) return { kind: 'iframe', src: `https://player.vimeo.com/video/${vid}` };
    }

    // Google Drive — convert share/view URLs to embed
    if (host === 'drive.google.com') {
      // https://drive.google.com/file/d/FILE_ID/view
      const fileMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
      if (fileMatch) return { kind: 'iframe', src: `https://drive.google.com/file/d/${fileMatch[1]}/preview` };
      // https://drive.google.com/open?id=FILE_ID
      const openId = parsed.searchParams.get('id');
      if (openId) return { kind: 'iframe', src: `https://drive.google.com/file/d/${openId}/preview` };
    }

    // Loom
    if (host === 'loom.com' || host === 'www.loom.com') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      const shareIdx = parts.indexOf('share');
      const id = shareIdx >= 0 ? parts[shareIdx + 1] : parts[parts.length - 1];
      if (id) return { kind: 'iframe', src: `https://www.loom.com/embed/${id}` };
    }

    // Wistia
    if (host.includes('wistia.com')) {
      const wMatch = parsed.pathname.match(/\/medias\/([^/?]+)/);
      if (wMatch) return { kind: 'iframe', src: `https://fast.wistia.net/embed/iframe/${wMatch[1]}` };
    }
  } catch {}

  if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(url)) return { kind: 'video', src: url };
  return { kind: 'link', src: url };
}

function VideoPlayer({ url, onHoverChange }: { url: string; onHoverChange?: (h: boolean) => void }) {
  const embed = videoEmbed(url);
  const hoverProps = onHoverChange ? { onMouseEnter: () => onHoverChange(true), onMouseLeave: () => onHoverChange(false) } : {};
  if (embed.kind === 'iframe') return <div className="tc-video" {...hoverProps}><iframe src={embed.src} title="Client testimonial video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>;
  if (embed.kind === 'video') return <div className="tc-video" {...hoverProps}><video src={embed.src} controls preload="none" playsInline /></div>;
  return <a className="tc-watch" href={embed.src} target="_blank" rel="noopener noreferrer">Watch the story <ArrowUpRight size={14} /></a>;
}

export default function Testimonials({initial=[]}:{initial?:Testimonial[]}){
  const [testimonials,setTestimonials]=useState<Testimonial[]>(initial);
  const [api,setApi]=useState<CarouselApi>();
  const [selected,setSelected]=useState(0);
  const [paused,setPaused]=useState(false);
  const [hovered,setHovered]=useState(false);
  const [visible,setVisible]=useState(false);
  const [tabVisible,setTabVisible]=useState(true);
  const [reduced,setReduced]=useState(true);
  const region=useRef<HTMLElement>(null);
  const playing=!paused&&!hovered&&visible&&tabVisible&&!reduced;
  useEffect(()=>{
    if(initial.length>0)return;
    const controller=new AbortController();
    fetch('/api/testimonials',{signal:controller.signal}).then(async r=>{
      if(!r.ok)return;
      const payload=await r.json();
      if(Array.isArray(payload.testimonials))setTestimonials(payload.testimonials);
    }).catch(()=>{});
    return ()=>controller.abort();
  },[]);
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReduced(media.matches);
    const visibility=()=>setTabVisible(!document.hidden);
    update();visibility();media.addEventListener('change',update);document.addEventListener('visibilitychange',visibility);
    const observer=new IntersectionObserver(entries=>setVisible(entries[0]?.isIntersecting??false),{threshold:.15});
    if(region.current)observer.observe(region.current);
    return()=>{observer.disconnect();media.removeEventListener('change',update);document.removeEventListener('visibilitychange',visibility);};
    // Re-run when the list populates: on first render the section has no ref
    // (loading branch), so the observer must attach after testimonials load.
  },[testimonials.length]);
  useEffect(()=>{
    if(!api)return;
    const select=()=>setSelected(api.selectedScrollSnap());
    const interact=()=>setPaused(true);
    select();api.on('select',select);api.on('pointerDown',interact);
    return()=>{api.off('select',select);api.off('pointerDown',interact);};
  },[api]);
  useEffect(()=>{
    if(!api||!playing)return;
    const timer=window.setTimeout(()=>api.scrollNext(),3000);
    return()=>window.clearTimeout(timer);
  },[api,playing,selected]);
  useEffect(()=>{
    if(!api)return;
    const viewport=api.rootNode();
    const track=api.containerNode();
    const slides=api.slideNodes();
    track.style.alignItems='flex-start';
    viewport.style.transition='height .35s ease';
    const fit=()=>{const slide=slides[api.selectedScrollSnap()];if(slide)viewport.style.height=`${slide.offsetHeight}px`;};
    fit();
    const observer=new ResizeObserver(fit);
    slides.forEach(slide=>observer.observe(slide));
    api.on('select',fit);api.on('reInit',fit);
    return()=>{observer.disconnect();api.off('select',fit);api.off('reInit',fit);viewport.style.height='';viewport.style.transition='';track.style.alignItems='';};
  },[api,testimonials.length]);
  function go(index:number){if(testimonials.length===0)return;setPaused(true);api?.scrollTo((index+testimonials.length)%testimonials.length,reduced);}
  if(testimonials.length===0){
    return <section id="testimonials" className="hp-proof tc-section" data-loading="true">
      <div className="hp-wrap tc-inner"><div className="tc-heading"><p className="hp-overline">The nicest part of our work? Hearing this.</p></div><p>Gathering kind words…</p></div>
    </section>;
  }
  return <section id="testimonials" className="hp-proof tc-section" ref={region} onFocusCapture={e=>{if(!(e.target as HTMLElement).closest('[data-rotation-control]'))setPaused(true);}}>
    <div className="hp-wrap tc-inner"><div className="tc-heading"><p className="hp-overline">The nicest part of our work? Hearing this.</p></div>
      <Carousel opts={{loop:true}} setApi={setApi} aria-label="What our clients say" onKeyDownCapture={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();go(selected+(e.key==='ArrowLeft'?-1:1));}}}>
        <CarouselContent aria-live={playing?'off':'polite'}>{testimonials.map((item,index)=><CarouselItem key={item.id} aria-label={`${index+1} of ${testimonials.length}`} aria-hidden={index!==selected}><div className="tc-slide"><span className="tc-quote-mark" aria-hidden="true">&ldquo;</span><blockquote>{item.quote}</blockquote>{item.videoUrl&&<VideoPlayer url={item.videoUrl} onHoverChange={setHovered}/>}<div className="tc-attribution">{item.avatarUrl?<img className="tc-avatar" width={46} height={46} src={item.avatarUrl} alt={`Photo of ${item.name}`} loading="lazy"/>:<span className="hp-initials">{item.initials}</span>}<div><strong>{item.name}</strong>{item.label&&<p>{item.label}</p>}</div></div></div></CarouselItem>)}</CarouselContent>
        <div className="tc-controls"><div className="tc-dots" aria-label="Choose a testimonial">{testimonials.map((item,index)=><Button key={item.id} variant="ghost" aria-label={`Show testimonial from ${item.name}`} aria-pressed={selected===index} onClick={()=>go(index)} disabled={!api}><span/></Button>)}</div><span className="tc-count">{String(selected+1).padStart(2,'0')} / {String(testimonials.length).padStart(2,'0')}</span><div className="tc-buttons"><Button variant="outline" size="icon" onClick={()=>go(selected-1)} disabled={!api} aria-label="Previous testimonial"><ArrowLeft size={17}/></Button><Button variant="outline" size="icon" onClick={()=>go(selected+1)} disabled={!api} aria-label="Next testimonial"><ArrowRight size={17}/></Button></div></div>
      </Carousel>
    </div>
  </section>;
}
