import type { Metadata } from 'next';
import { ArrowUpRight, Asterisk, MapPin } from 'lucide-react';
import PlayfulHeader from '../playful-header';
import BrandMark from '../brand-mark';
import MessageBuilder from './message-builder';
import DirectContact from './direct-contact';
import '../playful-home.css';
import './talk.css';

export const metadata:Metadata={title:'Let’s talk | HandySolver',description:'Bring your ideas, questions and everyday business headaches. Start a conversation with HandySolver.'};
export default function LetsTalk(){return <div className="handy-home talk-page"><a className="hp-skip" href="#main">Skip to contact</a><PlayfulHeader/>
  <main id="main" className="hp-wrap">
    <section className="lt-main"><div className="lt-intro"><p className="hp-overline">BIG IDEA? SMALL HEADACHE? SAY HELLO.</p><h1>Bring the<br/><em>messy version.</em></h1><p className="lt-lede">The unfinished idea. The daily workaround.<br/>The “there must be a better way.”<br/>Let’s start there.</p><div className="lt-note"><Asterisk size={29} aria-hidden="true"/><p>You don’t need<br/>all the answers.<br/><em>Just a hello.</em></p></div><DirectContact/></div><MessageBuilder/></section>
    <section className="lt-details"><div className="lt-location"><MapPin size={28} aria-hidden="true"/><div><p className="hp-overline">BASED IN GURUGRAM. OPEN TO GOOD IDEAS.</p><h2>A real place.<br/><em>Real people.</em></h2><address>C 705, Pioneer Urban Square<br/>Golf Course Extension Road, Sector 62<br/>Gurugram, Haryana 122101, India</address></div><a href="https://www.google.com/maps/search/?api=1&query=C+705+Pioneer+Urban+Square+Sector+62+Gurugram" target="_blank" rel="noopener noreferrer">Find us on the map <ArrowUpRight size={17}/></a></div><div className="lt-career"><p className="hp-overline">LOOKING FOR YOUR NEXT CHAPTER?</p><h2>Different conversation.<br/><em>Same good company.</em></h2><p>If you’re here to join the team, start with our open roles.</p><a href="/careers/open-roles">Find your next thing <ArrowUpRight size={20}/></a></div></section>
  </main><footer className="hp-footer hp-wrap"><div className="hp-footer-top"><a className="hp-logo" href="/" aria-label="HandySolver home"><BrandMark/></a><p>Good work starts<br/>with a conversation.</p><div><a href="/team">Our people</a><a href="/careers">Careers</a></div></div><div className="hp-footer-bottom"><span>© {new Date().getFullYear()} HandySolver</span><span>Gurugram, India. Good ideas travel.</span></div></footer></div>;}
