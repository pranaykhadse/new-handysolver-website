'use client';
import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import './floating-roles.css';

// The "See all roles" pill follows the visitor down the page, then fades away at the footer
// (the same way the workflow-check button does) so it never sits on top of the footer links.
export default function FloatingRoles({ href }: { href: string }) {
  const [atFooter, setAtFooter] = useState(false);
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;
    const observer = new IntersectionObserver(([entry]) => setAtFooter(entry.isIntersecting), { threshold: 0 });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);
  return <a className="pc-floating-roles" href={href} data-docked={atFooter ? 'true' : 'false'} tabIndex={atFooter ? -1 : undefined} aria-hidden={atFooter ? true : undefined}>
    <span>See all roles</span><span className="pc-floating-arrow" aria-hidden="true"><ArrowUpRight size={22}/></span>
  </a>;
}
