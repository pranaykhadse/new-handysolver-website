'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, ArrowRight, Menu, X } from 'lucide-react';
import BrandMark from './brand-mark';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import './refined-header.css';
import ScrollMotion from './scroll-motion';
import { scrollToSection, entryBonus } from './section-scroll';
import './scroll-motion.css';
import './mobile-polish.css';
import HomeDepth from './home-depth';
import './page-depth.css';
import './page-backgrounds.css';

const links = [
  { label: 'What we do', href: '/#solutions', number: '01' },
  { label: 'How we work', href: '/#approach', number: '02' },
  { label: 'Our people', href: '/team', number: '03' },
  { label: 'Careers', href: '/careers', number: '04' },
];
const contact = '/lets-talk';

export default function PlayfulHeader() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState('');
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 24);
      if (pathname !== '/') { setActiveSection(''); return; }
      const marker = Math.max(120, window.innerHeight * .3);
      let active = '';
      for (const id of ['solutions', 'approach', 'about']) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= marker) active = id;
      }
      setActiveSection(active);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', schedule);
    // Same calibrated landing for every in-page hash link (hero anchor,
    // knot link, skip links…): header-handled clicks already preventDefault,
    // so this only takes the rest.
    const onDocClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const anchor = t?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      const hash = anchor?.getAttribute('href');
      if (!anchor || !hash || hash.length < 2 || !document.getElementById(hash.slice(1))) return;
      e.preventDefault();
      const id = hash.slice(1);
      scrollToSection(id, entryBonus(id, anchor));
      window.history.replaceState({}, '', hash);
    };
    document.addEventListener('click', onDocClick);
    // Cross-page hash arrival (e.g. /team → /careers#life): same calibration
    // as same-page clicks. Runs immediately with no delay — one continuous
    // motion instead of native-jump, pause, glide.
    const hash = window.location.hash;
    if (hash.length > 1 && document.getElementById(hash.slice(1))) {
      scrollToSection(hash.slice(1));
    }
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('hashchange', schedule);
      document.removeEventListener('click', onDocClick);
    };
  }, [pathname]);
  const current = (href: string): 'page' | 'location' | undefined => {
    if (href === '/team') return pathname === '/team' ? 'page' : pathname === '/' && activeSection === 'about' ? 'location' : undefined;
    if (href === '/careers') return pathname?.startsWith('/careers') ? 'page' : undefined;
    return pathname === '/' && activeSection && href === '/#' + activeSection ? 'location' : undefined;
  };
  // (Same-page anchor landing lives in ./section-scroll so the capture-phase
  // ScrollMotion handler and this fallback share one calibration.)
  return <header className={`hn-shell${scrolled ? ' hn-scrolled' : ''}`}><ScrollMotion/>{pathname !== '/' && <HomeDepth key={pathname} rootSelector=".handy-home:not(.handy-depth)" cardSelector=".pc-polaroid, .pc-moment, .tw-portrait, .tw-snapshots figure, .lt-note, .tw-hello, .ce-nudge"/>}<div className="hn-header hp-wrap">
    <a className="hn-brand" href="/" aria-label="HandySolver home"><BrandMark /></a>
    <nav className="hn-nav" aria-label="Main navigation">
      {links.map(link => <a href={link.href} key={link.href} aria-current={current(link.href)} onClick={(e) => {
        if (!link.href.startsWith('/#') || pathname !== '/') return;
        e.preventDefault();
        scrollToSection(link.href.slice(2));
        window.history.replaceState({}, '', link.href);
      }}><span>{link.label}</span><i aria-hidden="true"/></a>)}
    </nav>
    <a className="hn-contact" href={contact}><span>Let’s talk</span><span className="hn-contact-icon"><ArrowUpRight size={19}/></span></a>
    <a className="hn-mobile-contact" href={contact} aria-label="Let’s talk"><ArrowUpRight size={21}/></a>
    <Sheet>
      <SheetTrigger className="hn-menu-trigger" aria-label="Open navigation"><span>Explore</span><Menu size={20}/></SheetTrigger>
      <SheetContent className="hn-sheet" side="right" showCloseButton={false}>
        <SheetHeader className="hn-sheet-head"><SheetTitle><BrandMark/></SheetTitle><SheetDescription>A little less complicated. A little more human.</SheetDescription></SheetHeader>
        <SheetClose className="hn-sheet-close" aria-label="Close navigation"><X size={20}/></SheetClose>
        <nav className="hn-mobile-nav" aria-label="Mobile navigation">{links.map(link => <SheetClose asChild key={link.href}><a href={link.href} aria-current={current(link.href)}><small>{link.number}</small><span>{link.label}</span><ArrowUpRight size={22}/></a></SheetClose>)}</nav>
        <div className="hn-sheet-foot"><p>Got a good<br/><em>“what if”?</em></p><a href={contact}>Let’s work it out <ArrowRight size={21}/></a></div>
      </SheetContent>
    </Sheet>
  </div></header>;
}
