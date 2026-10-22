import { ArrowUpRight, ArrowRight, Asterisk, MoveUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import { OG_DEFAULTS } from '@/lib/seo';
import { HomeMotion } from './playful-interactions';
import ProcessJourney from './process-journey';
import PlayfulHeader from './playful-header';
import KnotScene from './knot-scene';
import VisualServices from './visual-services';
import Testimonials from './testimonials';
import HomeDepth from './home-depth';
import HeroHeadline from './hero-headline';
import WorkflowAudit from './workflow-audit';
import CaseStudyShowcase from './case-study-showcase';
import DayShift from './day-shift';
import MissionBand from './mission-band';
import './playful-home.css';
import './hero-copy.css';
import './home-depth.css';
import './home-backgrounds.css';
import './case-study-transition.css';
import './home-final-polish.css';
import './mission-refresh.css';
import './visitor-polish.css';

const contact = '/lets-talk';
export const metadata: Metadata = {
  title: 'Handysolver | Ideas into impact',
  description: 'Hands-on business transformation, custom software, and practical AI. Bring people, processes, and technology together with Handysolver.',
  alternates: { canonical: '/' },
  openGraph: { ...OG_DEFAULTS,
    title: 'Handysolver | Ideas into impact',
    description: 'Hands-on business transformation, custom software, and practical AI. Bring people, processes, and technology together with Handysolver.',
    url: '/',
  },
};
export default function Home() {
  return <div className="handy-home handy-depth">
    <HomeDepth />
    <HomeMotion />
    <a className="hp-skip" href="#main">Skip to content</a>
    <PlayfulHeader />
    <WorkflowAudit />
    <main id="main">
      <section className="hp-hero hp-wrap">
        <div className="hp-hero-copy">
          <HeroHeadline />
          <p className="hp-lede">We help businesses replace disconnected tools, manual processes and repetitive tasks with connected software and practical automation.</p>
          <ul className="hp-offer-cues" aria-label="How we help"><li>Connect your systems</li><li>Simplify your processes</li><li>Automate routine work</li></ul>
          <a className="hp-button" href={contact}>Show us what&#8217;s slowing you down</a>
          <span className="hp-aside">No big pitch. Let’s start with your problem.</span>
        </div>
        <KnotScene />
        <div className="hp-hero-bottom"><span>People first. Technology second.</span></div>
      </section>

      <CaseStudyShowcase />

      <section className="hp-intro-strip" aria-label="Our approach"><div className="hp-wrap"><span>Less Manual Work.</span><Asterisk/><span>More Headspace.</span><Asterisk/><span>That’s Handy.</span><Asterisk/></div></section>

      <div className="hp-services-wash">
      <section className="hp-solutions hp-wrap" id="solutions">
        <div className="hp-section-top hp-reveal"><p className="hp-overline">Sound familiar?</p><h2>There’s usually<br/><em>a better way.</em></h2><p>We don’t start with a list of technologies.<br/>We start with what’s getting in your way.</p></div>
      </section>

      <VisualServices />
      </div>

      <DayShift />

      <Testimonials/>

      <ProcessJourney />

      <MissionBand />

      <section className="hr-people hp-wrap hp-reveal" id="about"><div className="hr-team-photo"><img src="https://handysolver.com/assets/images/rock-n-roll/foosball-short.jpg" alt="Handysolver team sharing a relaxed moment in the office" width="261" height="195"/><span>Real people.<br/><em>Useful work.</em></span></div><div className="hr-people-copy"><p className="hp-overline">Meet the humans behind the handy.</p><h2>Good people.<br/>Sleeves rolled up.</h2><p>Hands-on thinkers who care about the people using what we build.</p><div className="hp-people-links"><a className="hp-text-link" href="/team">Meet the team <ArrowUpRight size={17}/></a><a className="hp-text-link" href="/careers">Come build with us <ArrowUpRight size={17}/></a></div></div></section>

      <section className="hp-contact" id="contact-band"><div className="hp-wrap"><p className="hp-overline">Over to you.</p><a className="hp-big-contact" href={contact}><span>What’s your<br/><em>“there must be<br/>a better way”?</em></span><span className="hp-contact-arrow"><MoveUpRight size={70} strokeWidth={1.2}/></span></a><div className="hp-contact-bottom"><p>Let’s find it. Together.</p><a href={contact}>Start a conversation <ArrowUpRight size={18}/></a></div></div></section>
    </main>
    <footer className="hp-footer hp-wrap"><div className="hp-footer-top"><div><a href="/careers">Careers</a><a href="https://in.linkedin.com/company/handysolver">LinkedIn</a><a href={contact}>Contact</a></div></div><div className="hp-footer-bottom"><span>© {new Date().getFullYear()} Handysolver</span><span>Gurugram, India. Good ideas travel.</span><a href="#main">Back to the top ↑</a></div></footer>
  </div>;
}
