'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import './workflow-audit.css';

const WorkflowAuditDialog = dynamic(() => import('./workflow-audit-dialog'), { ssr: false });

export default function WorkflowAudit() {
  const [open, setOpen] = useState(false);
  const [wanted, setWanted] = useState(false);
  const [atFooter, setAtFooter] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;
    const observer = new IntersectionObserver(([entry]) => setAtFooter(entry.isIntersecting), { threshold: 0 });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);
  const show = () => { setWanted(true); setOpen(true); };

  return <>
    <Button ref={launcher} className="wa-launch" data-compact={false} data-docked={atFooter ? 'true' : 'false'} tabIndex={atFooter ? -1 : undefined} aria-hidden={atFooter ? true : undefined} aria-haspopup="dialog" onClick={show} onPointerEnter={() => setWanted(true)} onFocus={() => setWanted(true)}><span className="wa-launch-icon"><Gauge size={22} aria-hidden="true"/></span><span className="wa-launch-copy">How tangled is your work?<small>Take the 2-minute workflow check</small></span></Button>
    {wanted && <WorkflowAuditDialog open={open} onOpenChange={setOpen} onClosed={() => launcher.current?.focus()} />}
  </>;
}
