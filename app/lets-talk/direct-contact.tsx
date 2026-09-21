import { ArrowUpRight, Mail, MessageCircle } from 'lucide-react';

export default function DirectContact(){return <div className="lt-direct-options">
  <a className="lt-direct lt-whatsapp-direct" href="https://wa.me/919971815001?text=Hi%20HandySolver%2C%20I%E2%80%99d%20like%20to%20talk%20about%20my%20business%20workflow." target="_blank" rel="noopener noreferrer"><MessageCircle size={23} aria-hidden="true"/><span><small>JUST WANT TO SAY HELLO?</small>Chat on WhatsApp<strong>+91 99718 15001</strong></span><ArrowUpRight size={20}/></a>
  <a className="lt-direct" href="mailto:connect@handysolver.com"><Mail size={19}/><span><small>MORE OF AN EMAIL PERSON?</small>connect@handysolver.com</span><ArrowUpRight size={20}/></a>
</div>;}
