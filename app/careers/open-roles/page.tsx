import type { Metadata } from 'next';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import PlayfulHeader from '../../playful-header';
import BrandMark from '../../brand-mark';
import RoleBoard from './role-board';
import { CandidateNudge } from './candidate-extras';
import '../../playful-home.css';
import './roles.css';
import './candidate-extras.css';
export const metadata:Metadata={title:'Open roles at HandySolver | Find your next thing',description:'Explore current HandySolver vacancies, read role details, and apply through our recruitment portal.'};
export default function OpenRoles(){return <div className="handy-home open-roles-page"><a className="hp-skip" href="#main">Skip to open roles</a><PlayfulHeader/><main id="main" className="hp-wrap"><a className="or-back" href="/careers"><ArrowLeft size={15}/>Life at HandySolver</a><section className="or-heading"><div><p className="hp-overline">OPEN ROLES / HANDYSOLVER</p><h1>Find your<br/><em>next thing.</em></h1><p>Something you’re good at. Something you care about.<br/>Let’s see where the two meet.</p></div><CandidateNudge/></section><RoleBoard/><section className="or-bottom"><div><p className="hp-overline">STILL GETTING A FEEL FOR US?</p><h2>Meet the humans<br/><em>behind the handy.</em></h2></div><a href="/team">Meet the team <ArrowUpRight size={23}/></a></section></main><footer className="hp-footer hp-wrap"><div className="hp-footer-top"><a className="hp-logo" href="/" aria-label="HandySolver home"><BrandMark/></a><p>Good work. Good people.<br/>Room for your curious side.</p><div><a href="/careers">Careers</a><a href="/lets-talk">Contact</a></div></div><div className="hp-footer-bottom"><span>© {new Date().getFullYear()} HandySolver</span><span>Gurugram, India. Good ideas travel.</span></div></footer></div>;}
