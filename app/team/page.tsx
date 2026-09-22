import type { Metadata } from 'next';
import { ArrowUpRight, ArrowLeft, Asterisk } from 'lucide-react';
import PlayfulHeader from '../playful-header';
import BrandMark from '../brand-mark';
import BreadcrumbsJsonLd from '../breadcrumbs-jsonld';
import TeamWall from './team-wall';
import CareerPhoto from '../careers/photo';
import '../playful-home.css';
import './team.css';

export const metadata:Metadata={title:'Meet the team | HandySolver',description:'Meet the humans behind the handy. A look at the people and everyday moments at HandySolver.',alternates:{canonical:'/team'},openGraph:{title:'Meet the team | HandySolver',description:'Meet the humans behind the handy. A look at the people and everyday moments at HandySolver.',url:'/team'}};

export default function TeamPage(){return <div className="handy-home team-page"><BreadcrumbsJsonLd items={[{ name: 'Home', path: '/' }, { name: 'Team', path: '/team' }]} />
  <a className="hp-skip" href="#main">Skip to the team</a><PlayfulHeader/>
  <main id="main" className="hp-wrap">
    <a className="tw-back" href="/#about"><ArrowLeft size={14}/>Back to the big picture</a>
    <section className="tw-hero"><div><p className="hp-overline">MEET THE HUMANS BEHIND THE HANDY</p><h1>Good people.<br/><em>Great company.</em></h1></div><div className="tw-hello"><Asterisk size={34} aria-hidden="true"/><p>Less “resources”.<br/>More <em>real people.</em></p><span>Ideas. Questions. A little personality.</span></div></section>
    <TeamWall/>
    <section className="tw-offscreen" aria-labelledby="offscreen-title"><div className="tw-offscreen-copy"><p className="hp-overline">NOT ALWAYS AT OUR DESKS</p><h2 id="offscreen-title">There’s a whole team<br/><em>outside the tabs.</em></h2><p>A game between tasks. A birthday worth pausing for. The small moments are part of the picture, too.</p><a href="/careers#life">A little more life here <ArrowUpRight size={18}/></a></div><div className="tw-snapshots"><figure><CareerPhoto src="https://handysolver.com/assets/images/rock-n-roll/foosball-short.jpg" alt="HandySolver colleagues around the foosball table"/><figcaption>A different kind of team challenge.</figcaption></figure><figure><CareerPhoto src="https://handysolver.com/assets/images/rock-n-roll/birthday-cake.jpg" alt="A birthday celebration with the HandySolver team"/><figcaption>Always room for a slice.</figcaption></figure></div></section>
    <section className="tw-invite"><div><p className="hp-overline">LIKE THE COMPANY?</p><h2>Bring your own<br/><em>kind of handy.</em></h2></div><a href="/careers/open-roles">Explore open roles <span><ArrowUpRight size={27}/></span></a></section>
  </main>
  <footer className="hp-footer hp-wrap"><div className="hp-footer-top"><a className="hp-logo" href="/" aria-label="HandySolver home"><BrandMark/></a><p>Good work. Good people.<br/>Room for your curious side.</p><div><a href="/careers">Careers</a><a href="/lets-talk">Contact</a></div></div><div className="hp-footer-bottom"><span>© {new Date().getFullYear()} HandySolver</span><span>Gurugram, India. Good ideas travel.</span></div></footer>
</div>;}
