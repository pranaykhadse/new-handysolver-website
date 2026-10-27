import type { Metadata } from 'next';
import { OG_DEFAULTS } from '@/lib/seo';
import { ArrowUpRight, Asterisk, MapPin } from 'lucide-react';
import CareerPhoto from './photo';
import BreadcrumbsJsonLd from '../breadcrumbs-jsonld';
import PlayfulHeader from '../playful-header';
import { HomeMotion } from '../playful-interactions';
import CultureCards from './culture-cards';
import TopRoles from './top-roles';
import '../playful-home.css';
import './playful-careers.css';
import './top-roles.css';
import './career-refresh.css';
import './floating-roles.css';

export const metadata: Metadata = { title: 'Careers at Handysolver | Bring your curious side', description: 'Good people. Useful work. Explore life at Handysolver in Gurugram and find your next opportunity.', alternates: { canonical: '/careers' }, openGraph: { ...OG_DEFAULTS, title: 'Careers at Handysolver | Bring your curious side', description: 'Good people. Useful work. Explore life at Handysolver in Gurugram and find your next opportunity.', url: '/careers' } };
const jobs = '/careers/open-roles';

export default function Careers() {
  return <div className="handy-home playful-careers"><BreadcrumbsJsonLd items={[{ name: 'Home', path: '/' }, { name: 'Careers', path: '/careers' }]} /><HomeMotion/><a href="#main" className="hp-skip">Skip to content</a><PlayfulHeader/>
    <main id="main">
      <section className="pc-hero hp-wrap"><div><h1>Bring your<br/><em>curious side.</em></h1><p className="pc-lede">The questions. The half-formed ideas. The &ldquo;what if we tried this?&rdquo;<br/>There&rsquo;s room for all of it here.</p><div className="pc-actions"><a className="hp-button" href={jobs}>Find your next thing <ArrowUpRight size={19}/></a><a className="pc-link" href="/team">Meet your kind of people <ArrowUpRight size={17}/></a></div></div><div className="pc-scrapbook"><span className="pc-note">Curious minds.<br/><em>Meaningful work.</em></span><figure className="pc-polaroid"><CareerPhoto priority src="/legacy/images/rock-n-roll/foosball-short.jpg" alt="Handysolver team members enjoying foosball at the office"/><figcaption>Not every good idea happens at a desk. &#8599;</figcaption></figure><span className="pc-sticker">People first.<br/>Always.</span><p className="pc-photo-caption">A little glimpse of life here &#8598;</p></div></section>
      <section className="pc-strip" aria-label="Our team spirit"><div className="hp-wrap"><span>Ask why.</span><Asterisk aria-hidden="true"/><span>Make something useful.</span><Asterisk aria-hidden="true"/><span>Stay human.</span></div></section>
      <section id="life" className="pc-life hp-wrap hp-reveal"><div className="pc-section-heading cv-fun-heading"><div><p className="hp-overline">NO NEED TO FIT A MOULD.</p><h2>A little different?<br/><em>Good.</em></h2></div><p>Pick your energy &#8595;</p></div><CultureCards/></section>
      <section className="pc-moments hp-wrap hp-reveal" aria-label="Life at Handysolver"><div className="pc-moments-title"><p className="hp-overline">THE BITS BETWEEN THE WORK.</p><h2>Real people.<br/><em>Unscripted moments.</em></h2><a className="pc-link" href="/gallery">A peek at our photo album <ArrowUpRight size={17}/></a></div><figure className="pc-moment pc-moment-one"><CareerPhoto src="/legacy/images/rock-n-roll/table-tennis.jpg" alt="Colleagues playing table tennis at Handysolver"/><figcaption>One quick game. Famous last words.</figcaption></figure><figure className="pc-moment pc-moment-two"><CareerPhoto src="/legacy/images/rock-n-roll/birthday-cake.jpg" alt="Birthday celebration at Handysolver"/><figcaption>There&rsquo;s always room for cake.</figcaption></figure></section>
      <section className="pc-office cv-office-postcard"><div className="hp-wrap pc-office-inner hp-reveal"><div className="pc-office-photo"><CareerPhoto src="/legacy/images/dummy/urban_square_office_suites.jpg" alt="Pioneer Urban Square, home to Handysolver&rsquo;s Gurugram office"/><span><MapPin size={15}/> Our little corner of Gurugram</span></div><div><p className="hp-overline">OFFLINE, IN GOOD COMPANY.</p><h2>See you<br/><em>in Gurugram.</em></h2><address><span>OUR CORNER OF THE WORLD &#8601;</span>C 705, Pioneer Urban Square<br/>Sector 62, Golf Course Extension Road<br/>Gurugram, Haryana, India</address></div></div></section>
      <section id="roles" className="pc-top-roles hp-wrap hp-reveal"><div className="pc-top-roles-head"><h2>Your next<br/><em>chapter.</em></h2><a className="pc-more-link" href={jobs}>Explore more roles <ArrowUpRight size={15}/></a></div><TopRoles/></section>
    </main><footer className="hp-footer hp-wrap"><div className="hp-footer-top"><p>Good people. Good work. Room for your curious side.</p><div><a href="/">Home</a><a href="https://in.linkedin.com/company/handysolver" target="_blank" rel="noopener noreferrer">LinkedIn</a><a href="/lets-talk">Contact</a></div></div><div className="hp-footer-bottom"><span>&copy; {new Date().getFullYear()} Handysolver</span><span>Gurugram, India. Good ideas travel.</span><a href="#main">Back to the top &#8593;</a></div></footer>
    <a className="pc-floating-roles" href={jobs}><span>See all roles</span><span className="pc-floating-arrow" aria-hidden="true"><ArrowUpRight size={22}/></span></a>
  </div>;
}
