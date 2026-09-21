import { ArrowUpRight, ArrowRight, ArrowDown, Asterisk, MoveUpRight } from 'lucide-react';
import { HomeMotion } from './playful-interactions';
import BrandMark from './brand-mark';
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
import './playful-home.css';
import './hero-copy.css';
import './home-depth.css';
import './home-backgrounds.css';
import './case-study-transition.css';
import './home-final-polish.css';
import './mission-refresh.css';
import './visitor-polish.css';

const contact = '/lets-talk';
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
          <p className="hp-overline"><span/> Software and automation for simpler operations</p>
          <HeroHeadline />
          <p className="hp-lede">We help businesses replace disconnected tools, manual processes and repetitive tasks with connected software and practical automation.</p>
          <ul className="hp-offer-cues" aria-label="How we help"><li>Connect your systems</li><li>Simplify your processes</li><li>Automate routine work</li></ul>
          <a className="hp-button" href={contact}>Show us what’s slowing you down <ArrowUpRight size={19}/></a>
          <span className="hp-aside">No big pitch. Let’s start with your problem.</span>
        </div>
        <KnotScene />
        <div className="hp-hero-bottom"><span>People first. Technology second.</span><a href="#solutions">A better way starts here <ArrowDown size={15}/></a></div>
      </section>

      <CaseStudyShowcase />

      <section className="hp-intro-strip" aria-label="Our approach"><div className="hp-wrap"><span>Less Manual Work.</span><Asterisk/><span>More headspace.</span><Asterisk/><span>That’s handy.</span><Asterisk/></div></section>

      <div className="hp-services-wash">
      <section className="hp-solutions hp-wrap" id="solutions">
        <div className="hp-section-top hp-reveal"><p className="hp-overline">Sound familiar?</p><h2>There’s usually<br/><em>a better way.</em></h2><p>We don’t start with a list of technologies.<br/>We start with what’s getting in your way.</p></div>
      </section>

      <VisualServices />
      </div>

      <DayShift />

      <Testimonials/>

      <ProcessJourney />

      <section className="hr-mission" aria-label="Our ambition"><div className="hp-wrap"><span>OUR AMBITION</span><p>Help <strong>100 companies</strong> reach <em>2× growth.</em></p><span className="hr-mission-arrow" aria-hidden="true"><ArrowUpRight/></span></div></section>

      <section className="hr-people hp-wrap hp-reveal" id="about"><div className="hr-team-photo"><img src="https://handysolver.com/assets/images/rock-n-roll/foosball-short.jpg" alt="HandySolver team sharing a relaxed moment in the office"/><span>Real people.<br/><em>Useful work.</em></span></div><div className="hr-people-copy"><p className="hp-overline">Meet the humans behind the handy.</p><h2>Good people.<br/>Sleeves rolled up.</h2><p>Hands-on thinkers who care about the people using what we build.</p><div className="hp-people-links"><a className="hp-text-link" href="/team">Meet the team <ArrowUpRight size={17}/></a><a className="hp-text-link" href="/careers">Come build with us <ArrowUpRight size={17}/></a></div></div></section>

      <section className="hp-contact"><div className="hp-wrap"><p className="hp-overline">Over to you.</p><a className="hp-big-contact" href={contact}><span>What’s your<br/><em>“there must be<br/>a better way”?</em></span><span className="hp-contact-arrow"><MoveUpRight size={70} strokeWidth={1.2}/></span></a><div className="hp-contact-bottom"><p>Let’s find it. Together.</p><a href={contact}>Start a conversation <ArrowUpRight size={18}/></a></div></div></section>
    </main>
    <footer className="hp-footer hp-wrap"><div className="hp-footer-top"><a className="hp-logo" href="/" aria-label="HandySolver home"><BrandMark /></a><p>Technology to your advantage.<br/>A little humanity, too.</p><div><a href="/careers">Careers</a><a href="https://in.linkedin.com/company/handysolver">LinkedIn</a><a href={contact}>Contact</a></div></div><div className="hp-footer-bottom"><span>© {new Date().getFullYear()} HandySolver</span><span>Gurugram, India. Good ideas travel.</span><a href="#main">Back to the top ↑</a></div></footer>
  </div>;
}
