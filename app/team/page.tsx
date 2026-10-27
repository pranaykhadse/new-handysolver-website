import type { Metadata } from 'next';
import { OG_DEFAULTS } from '@/lib/seo';
import { ArrowUpRight, ArrowLeft, Asterisk } from 'lucide-react';
import PlayfulHeader from '../playful-header';
import BreadcrumbsJsonLd from '../breadcrumbs-jsonld';
import TeamWall from './team-wall';
import { getTeamMembers } from '@/lib/content';
import CareerPhoto from '../careers/photo';
import '../playful-home.css';
import './team.css';

export const metadata:Metadata={title:'Meet the team | Handysolver',description:'Meet the humans behind the handy. A look at the people and everyday moments at Handysolver.',alternates:{canonical:'/team'},openGraph:{ ...OG_DEFAULTS,title:'Meet the team | Handysolver',description:'Meet the humans behind the handy. A look at the people and everyday moments at Handysolver.',url:'/team'}};

// Re-generated at most once a minute, so admin changes to the team show up quickly.
export const revalidate = 60;

export default async function TeamPage(){
  const { members } = await getTeamMembers();
  return <div className="handy-home team-page"><BreadcrumbsJsonLd items={[{ name: 'Home', path: '/' }, { name: 'Team', path: '/team' }]} />
  <a className="hp-skip" href="#main">Skip to the team</a><PlayfulHeader/>
  <main id="main" className="hp-wrap">
    <a className="tw-back" href="/#about"><ArrowLeft size={14}/>Back to the big picture</a>
    <section className="tw-hero"><div><p className="hp-overline">MEET THE TEAM</p><h1>The people<br/><em>behind the work.</em></h1></div><div className="tw-hello"><Asterisk size={34} aria-hidden="true"/><p>Less “resources”.<br/>More <em>real people.</em></p><span>Ideas. Questions. A little personality.</span></div></section>
    <TeamWall initial={members}/>
    <section className="tw-offscreen" aria-labelledby="offscreen-title"><div className="tw-offscreen-copy"><p className="hp-overline">NOT ALWAYS AT OUR DESKS</p><h2 id="offscreen-title">There’s a whole team<br/><em>outside the tabs.</em></h2><p>A game between tasks. A birthday worth pausing for. The small moments are part of the picture, too.</p><a href="/careers#life">A little more life here <ArrowUpRight size={18}/></a></div><div className="tw-snapshots"><figure><CareerPhoto src="https://szgcvfmvxdazxtlepxqg.supabase.co/storage/v1/object/public/gallery/first-outing/1792389231564-bzh8nrzlfki.jpg" alt="The Handysolver team gathered together on a team outing"/><figcaption>A different kind of team meeting.</figcaption></figure><figure><CareerPhoto src="https://szgcvfmvxdazxtlepxqg.supabase.co/storage/v1/object/public/gallery/christmas-2024/1792389318223-xbh1ag0f4h.jpg" alt="A Handysolver teammate decorating the office Christmas tree"/><figcaption>Always room for a little festive cheer.</figcaption></figure></div></section>
    <section className="tw-invite"><div><p className="hp-overline">LIKE THE COMPANY?</p><h2>Bring your own<br/><em>kind of handy.</em></h2></div><a href="/careers/open-roles">Explore open roles <span><ArrowUpRight size={27}/></span></a></section>
  </main>
  <footer className="hp-footer hp-wrap"><div className="hp-footer-top"><p>Good work. Good people. Room for your curious side.</p><div><a href="/careers">Careers</a><a href="/lets-talk">Contact</a></div></div><div className="hp-footer-bottom"><span>© {new Date().getFullYear()} Handysolver</span><span>Gurugram, India. Good ideas travel.</span></div></footer>
</div>;}
