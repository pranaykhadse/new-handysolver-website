import type { Metadata } from 'next';
import { ArrowUpRight, ArrowDown, Asterisk, MapPin } from 'lucide-react';
import CareerPhoto from './photo';
import BrandMark from '../brand-mark';
import PlayfulHeader from '../playful-header';
import { HomeMotion } from '../playful-interactions';
import CultureCards from './culture-cards';
import '../playful-home.css';
import './playful-careers.css';
import './career-refresh.css';
import './floating-roles.css';

export const metadata: Metadata = { title: 'Careers at HandySolver | Bring your curious side', description: 'Good people. Useful work. Explore life at HandySolver in Gurugram and find your next opportunity.' };
const jobs = '/careers/open-roles';

export default function Careers() {
  return <div className="handy-home playful-careers"><HomeMotion/><a href="#main" className="hp-skip">Skip to content</a><PlayfulHeader/>
    <main id="main">
      <section className="pc-hero hp-wrap"><div><p className="hp-overline"><span/> CAREERS AT HANDYSOLVER</p><h1>Bring your<br/><em>curious side.</em></h1><p className="pc-lede">The questions. The half-formed ideas. The “what if we tried this?”<br/>There’s room for all of it here.</p><div className="pc-actions"><a className="hp-button" href={jobs}>Find your next thing <ArrowUpRight size={19}/></a><a className="pc-link" href="#life">Meet your kind of people <ArrowDown size={17}/></a></div><p className="pc-location"><MapPin size={14}/> Made of people. Based in Gurugram.</p></div><div className="pc-scrapbook"><span className="pc-note">Good work.<br/><em>Better company.</em></span><figure className="pc-polaroid"><CareerPhoto priority src="https://handysolver.com/assets/images/rock-n-roll/foosball-short.jpg" alt="HandySolver team members enjoying foosball at the office"/><figcaption>Not every good idea happens at a desk. ↗</figcaption></figure><span className="pc-sticker">People first.<br/>Always.</span><p className="pc-photo-caption">A little glimpse of life here ↖</p></div></section>
      <section className="pc-strip" aria-label="Our team spirit"><div className="hp-wrap"><span>Ask why.</span><Asterisk aria-hidden="true"/><span>Make something useful.</span><Asterisk aria-hidden="true"/><span>Stay human.</span></div></section>
      <section id="life" className="pc-life hp-wrap hp-reveal"><div className="pc-section-heading cv-fun-heading"><div><p className="hp-overline">NO NEED TO FIT A MOULD.</p><h2>A little different?<br/><em>Good.</em></h2></div><p>Pick your energy ↓</p></div><CultureCards/></section>
      <section className="pc-moments hp-wrap hp-reveal" aria-label="Life at HandySolver"><div className="pc-moments-title"><p className="hp-overline">THE BITS BETWEEN THE WORK.</p><h2>Real people.<br/><em>Unscripted moments.</em></h2><a className="pc-link" href="/gallery" target="_blank" rel="noopener noreferrer">A peek at our photo album <ArrowUpRight size={17}/></a></div><figure className="pc-moment pc-moment-one"><CareerPhoto src="https://handysolver.com/assets/images/rock-n-roll/table-tennis.jpg" alt="Colleagues playing table tennis at HandySolver"/><figcaption>One quick game. Famous last words.</figcaption></figure><figure className="pc-moment pc-moment-two"><CareerPhoto src="https://handysolver.com/assets/images/rock-n-roll/birthday-cake.jpg" alt="Birthday celebration at HandySolver"/><figcaption>There’s always room for cake.</figcaption></figure></section>
      <section className="pc-office cv-office-postcard"><div className="hp-wrap pc-office-inner hp-reveal"><div className="pc-office-photo"><CareerPhoto src="https://handysolver.com/assets/images/dummy/urban_square_office_suites.jpg" alt="Pioneer Urban Square, home to HandySolver's Gurugram office"/><span><MapPin size={15}/> Our little corner of Gurugram</span></div><div><p className="hp-overline">OFFLINE, IN GOOD COMPANY.</p><h2>See you<br/><em>in Gurugram.</em></h2><address><span>OUR CORNER OF THE WORLD ↙</span>C 705, Pioneer Urban Square<br/>Sector 62, Golf Course Extension Road<br/>Gurugram, Haryana, India</address></div></div></section>
      <section id="roles" className="pc-roles cv-role-ticket hp-wrap hp-reveal"><div className="cv-ticket-message"><p className="hp-overline">YOUR NEXT CHAPTER</p><h2>Your kind<br/>of <em>place?</em></h2><span className="cv-ticket-note">Let’s find your kind of work. ↗</span></div><div className="pc-role-bottom"><a className="pc-role-cta" href={jobs}><span>Explore open roles<small>Find a role that feels like you</small></span><b><ArrowUpRight size={32}/></b></a></div></section>
    </main><footer className="hp-footer hp-wrap"><div className="hp-footer-top"><a className="hp-logo" href="/" aria-label="HandySolver home"><BrandMark/></a><p>Useful work. Good company.<br/>A little humanity, too.</p><div><a href="/">Home</a><a href="https://in.linkedin.com/company/handysolver" target="_blank" rel="noopener noreferrer">LinkedIn</a><a href="/lets-talk">Contact</a></div></div><div className="hp-footer-bottom"><span>© {new Date().getFullYear()} HandySolver</span><span>Gurugram, India. Good ideas travel.</span><a href="#main">Back to the top ↑</a></div></footer>
    <a className="pc-floating-roles" href={jobs}><span>Explore open roles</span><span className="pc-floating-arrow" aria-hidden="true"><ArrowUpRight size={22}/></span></a>
  </div>;
}
